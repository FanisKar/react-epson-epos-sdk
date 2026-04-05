import type { PrinterConfig } from "../printer.types";

export function getPrinterConfigFingerprint(config: PrinterConfig): string {
  return JSON.stringify({
    id: config.id,
    printerIp: config.printerIp,
    paperSize: config.paperSize,
    options: config.options ?? {},
  });
}

export function buildPrintersKey(printers: PrinterConfig[]): string {
  return printers.map(getPrinterConfigFingerprint).join("|");
}

export function assertUniquePrinterIds(printers: PrinterConfig[]): void {
  const seen = new Set<string>();
  for (const p of printers) {
    if (seen.has(p.id)) {
      throw new Error(`Duplicate printer id "${p.id}" in PrinterProvider printers prop. Each id must be unique.`);
    }
    seen.add(p.id);
  }
}
