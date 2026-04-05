import { useCallback, useContext, useMemo } from "react";
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

  const { instancesRef, instanceEpoch, printerStates, printForId, printerIdSet } = ctx;
  const isConfigured = printerIdSet.has(printerId);

  const printWhenUnconfigured = useCallback(
    async (_opts?: { retryOnError?: boolean }) => ({ printResult: PrintResult.ERROR }),
    []
  );

  return useMemo(
    () =>
      isConfigured
        ? {
            printer: instancesRef.current.get(printerId),
            status: printerStates[printerId]?.status ?? ConnectionStatus.DISCONNECTED,
            print: (opts?: { retryOnError?: boolean }) => printForId(printerId, opts),
          }
        : {
            printer: undefined,
            status: ConnectionStatus.DISCONNECTED,
            print: printWhenUnconfigured,
          },
    [isConfigured, instancesRef, instanceEpoch, printerId, printerStates, printForId, printWhenUnconfigured]
  );
}
