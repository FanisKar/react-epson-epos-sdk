import { useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { ConnectionStatus, PrintResult } from "../PrinterProvider.enum";
import type { Printer } from "../../components/Printer";
import { PrinterContext } from "./printerContext";
import type { PrintFn } from "./usePrinterRegistry";

const printWhenUnconfigured: PrintFn = async () => ({ printResult: PrintResult.ERROR });

export function usePrinterFromContext(printerId: string): {
  status: ConnectionStatus;
  printer: Printer | undefined;
  print: PrintFn;
} {
  const ctx = useContext(PrinterContext);
  if (!ctx) {
    throw new Error("usePrinter must be used within a PrinterProvider");
  }

  const { instancesRef, instanceEpoch, printerIdSet, subscribeToStatus, getStatusForId, getPrintForId } = ctx;
  const isConfigured = printerIdSet.has(printerId);

  const subscribe = useCallback(
    (cb: () => void) => (isConfigured ? subscribeToStatus(printerId, cb) : () => {}),
    [subscribeToStatus, isConfigured, printerId]
  );
  const getSnapshot = useCallback(
    () => (isConfigured ? getStatusForId(printerId) : ConnectionStatus.DISCONNECTED),
    [getStatusForId, isConfigured, printerId]
  );

  const status = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () => ({
      printer: isConfigured ? instancesRef.current.get(printerId) : undefined,
      status,
      print: isConfigured ? getPrintForId(printerId) : printWhenUnconfigured,
    }),
    [isConfigured, instancesRef, instanceEpoch, printerId, status, getPrintForId]
  );
}
