import dayjs from "dayjs";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Printer } from "../../components/Printer";
import { ConnectionStatus, PrintResult } from "../PrinterProvider.enum";
import type { PrinterRuntimeState, UnprintedQueueEntry } from "./internalTypes";

type Args = {
  instancesRef: RefObject<Map<string, Printer>>;
  setPrinterStates: Dispatch<SetStateAction<Record<string, PrinterRuntimeState | undefined>>>;
  setUnprintedById: Dispatch<SetStateAction<Record<string, UnprintedQueueEntry[]>>>;
};

/**
 * Sends the current XML buffer for one printer. On failure, optionally re-queues chunks (same behavior as v1).
 */
export function createPrintForId({ instancesRef, setPrinterStates, setUnprintedById }: Args) {
  return async function printForId(
    id: string,
    { retryOnError }: { retryOnError?: boolean } = { retryOnError: true }
  ): Promise<{ printResult: PrintResult }> {
    const execPrint = async () => {
      const printer = instancesRef.current.get(id);
      if (!printer) {
        return { printResult: PrintResult.ERROR };
      }
      try {
        await printer.send();
        return { printResult: PrintResult.SUCCESS };
      } catch {
        return { printResult: PrintResult.ERROR };
      }
    };

    const { printResult } = await execPrint();

    if (printResult === PrintResult.ERROR) {
      setPrinterStates(prev => {
        const cur = prev[id]?.status;
        if (cur !== ConnectionStatus.ERROR) {
          return { ...prev, [id]: { status: ConnectionStatus.ERROR, timestamp: dayjs() } };
        }
        return prev;
      });
      const printer = instancesRef.current.get(id);
      const xmlChunks = printer?.getXmlChunks();
      if (printer && xmlChunks?.length && retryOnError) {
        printer.setXmlChunks([]);
        setUnprintedById(prev => ({
          ...prev,
          [id]: [...(prev[id] ?? []), { data: xmlChunks }],
        }));
      }
    }

    return { printResult };
  };
}
