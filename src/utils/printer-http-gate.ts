/** One in-flight chain per Epson HTTP endpoint (shared across all `Printer` instances). */
const gateByEndpoint = new Map<string, Promise<void>>();

export type PrinterHttpEndpoint = {
  printerIp: string;
  devId: string;
  useHttps: boolean;
};

/** Stable key for the Epson `service.cgi` endpoint (same IP + devId share one gate). */
export function buildPrinterHttpGateKey({ printerIp, devId, useHttps }: PrinterHttpEndpoint): string {
  const scheme = useHttps ? "https" : "http";
  return `${scheme}://${printerIp}/cgi-bin/epos/service.cgi?devid=${encodeURIComponent(devId)}`;
}

/**
 * Serializes every HTTP POST to the same printer endpoint.
 * Epson `service.cgi` accepts one request at a time; overlapping print jobs and
 * heartbeats otherwise produce short-lived canceled fetches in the browser.
 */
export async function runSerializedPrinterHttp<T>(gateKey: string, operation: () => Promise<T>): Promise<T> {
  const previous = gateByEndpoint.get(gateKey);

  let markDone!: () => void;
  const done = new Promise<void>(resolve => {
    markDone = resolve;
  });
  gateByEndpoint.set(gateKey, done);

  try {
    if (previous) {
      // Prior op already surfaced its error to its caller; we only need ordering.
      await previous.catch(() => undefined);
    }
    return await operation();
  } finally {
    markDone();
    if (gateByEndpoint.get(gateKey) === done) {
      gateByEndpoint.delete(gateKey);
    }
  }
}
