import { useContext, useMemo } from "react";
import { ConnectionStatus, PrintResult } from "../PrinterProvider.enum";
import type { Printer } from "../../components/Printer";
import { PrinterContext } from "./printerContext";

export function usePrinterFromContext(printerId: string): {
  status: ConnectionStatus;
  printer: Printer | undefined;
  print: (opts?: { retryOnError?: boolean }) => Promise<{ printResult: PrintResult }>;
} {
  const ctx = useContext(PrinterContext);
  if (!ctx) {
    throw new Error("usePrinter must be used within a PrinterProvider");
  }
  if (!ctx.printerIdSet.has(printerId)) {
    throw new Error(
      `Unknown printer id "${printerId}". It must be included in the PrinterProvider printers prop (and match an existing id exactly).`
    );
  }

  const { instancesRef, instanceEpoch, printerStates, printForId } = ctx;

  return useMemo(
    () => ({
      printer: instancesRef.current.get(printerId),
      status: printerStates[printerId]?.status ?? ConnectionStatus.DISCONNECTED,
      print: (opts?: { retryOnError?: boolean }) => printForId(printerId, opts),
    }),
    [instancesRef, instanceEpoch, printerId, printerStates, printForId]
  );
}
