import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Printer } from "../../components/Printer";
import type { PrinterConfig } from "../printer.types";
import { ConnectionStatus, PrintResult } from "../PrinterProvider.enum";
import type { UnprintedQueueEntry } from "./internalTypes";
import { MAX_QUEUED_JOBS_PER_PRINTER } from "./printerProvider.constants";

type Args = {
  instancesRef: RefObject<Map<string, Printer>>;
  printersRef: RefObject<PrinterConfig[]>;
  /** Per-id promise chain. Lives in a ref so it survives `useMemo` invalidations of `printForId`. */
  lastOpByIdRef: RefObject<Map<string, Promise<void>>>;
  testMode: boolean;
  setStatusForId: (id: string, status: ConnectionStatus) => void;
  setUnprintedById: Dispatch<SetStateAction<Record<string, UnprintedQueueEntry[]>>>;
};

export type PrintForIdOptions = {
  retryOnError?: boolean;
  /** Used by the heartbeat-flush to send queued data without disturbing the live buffer. */
  fromQueue?: string[];
};

/**
 * Returns a per-id print function. Calls for the same id are serialized via a
 * promise chain so the buffer is never read across an `await`; different ids
 * run in parallel. On failure, chunks are requeued from a local snapshot.
 */
export function createPrintForId({
  instancesRef,
  printersRef,
  lastOpByIdRef,
  testMode,
  setStatusForId,
  setUnprintedById,
}: Args) {
  async function execPrint(
    id: string,
    { retryOnError = true, fromQueue }: PrintForIdOptions
  ): Promise<{ printResult: PrintResult }> {
    const printer = instancesRef.current.get(id);
    if (!printer) {
      return { printResult: PrintResult.ERROR };
    }

    const chunks = fromQueue ?? printer.consumeXmlChunks();

    if (testMode) {
      const printerIp = printersRef.current.find(p => p.id === id)?.printerIp ?? "(unknown)";
      const xml = printer.toXml(chunks);
      console.log("[react-epson-epos-sdk] testMode print", { printerIp, xml });
      return { printResult: PrintResult.SUCCESS };
    }

    try {
      await printer.sendChunks(chunks);
      return { printResult: PrintResult.SUCCESS };
    } catch {
      setStatusForId(id, ConnectionStatus.ERROR);

      if (chunks.length && retryOnError && printersRef.current.some(p => p.id === id)) {
        setUnprintedById(prev => {
          const queue = [...(prev[id] ?? []), { data: chunks }];
          if (queue.length > MAX_QUEUED_JOBS_PER_PRINTER) queue.shift();
          return { ...prev, [id]: queue };
        });
        return { printResult: PrintResult.QUEUED };
      }
      return { printResult: PrintResult.ERROR };
    }
  }

  return async function printForId(
    id: string,
    opts: PrintForIdOptions = {}
  ): Promise<{ printResult: PrintResult }> {
    const chain = lastOpByIdRef.current;
    const previous = chain.get(id);

    let markDone!: () => void;
    const myDone = new Promise<void>(resolve => {
      markDone = resolve;
    });
    chain.set(id, myDone);

    try {
      if (previous) {
        // Previous op's rejection is reported via its own return value; we only need it to have finished.
        try { await previous; } catch { /* noop */ }
      }
      return await execPrint(id, opts);
    } finally {
      markDone();
      if (chain.get(id) === myDone) {
        chain.delete(id);
      }
    }
  };
}
