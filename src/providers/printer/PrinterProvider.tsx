import { FC, ReactNode, useMemo } from "react";
import type { PrinterConfig } from "../printer.types";
import { assertUniquePrinterIds } from "./printerConfig.utils";
import { PrinterContext } from "./printerContext";
import { usePrinterRegistry } from "./usePrinterRegistry";
import { usePrinterRegistryEffects } from "./usePrinterRegistryEffects";
import { usePrinterFromContext } from "./usePrinterFromContext";

type PrinterProviderProps = {
  children: ReactNode;
  printers: PrinterConfig[];
  isDebugMode?: boolean;
  testMode?: boolean;
};

export const PrinterProvider: FC<PrinterProviderProps> = ({ children, printers, isDebugMode, testMode }) => {
  assertUniquePrinterIds(printers);

  const registry = usePrinterRegistry(printers, testMode);
  usePrinterRegistryEffects(registry, isDebugMode, testMode);

  const contextValue = useMemo(
    () => ({
      printerIdSet: registry.printerIdSet,
      instancesRef: registry.instancesRef,
      instanceEpoch: registry.instanceEpoch,
      subscribeToStatus: registry.subscribeToStatus,
      getStatusForId: registry.getStatusForId,
      getPrintForId: registry.getPrintForId,
    }),
    [
      registry.printerIdSet,
      registry.instancesRef,
      registry.instanceEpoch,
      registry.subscribeToStatus,
      registry.getStatusForId,
      registry.getPrintForId,
    ]
  );

  return <PrinterContext.Provider value={contextValue}>{children}</PrinterContext.Provider>;
};

export const usePrinter = usePrinterFromContext;
