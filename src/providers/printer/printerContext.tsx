import { createContext } from "react";
import type { RefObject } from "react";
import type { Printer } from "../../components/Printer";
import type { ConnectionStatus } from "../PrinterProvider.enum";
import type { PrintFn } from "./usePrinterRegistry";

export type PrinterContextValue = {
  printerIdSet: ReadonlySet<string>;
  instancesRef: RefObject<Map<string, Printer>>;
  instanceEpoch: number;
  subscribeToStatus: (id: string, callback: () => void) => () => void;
  getStatusForId: (id: string) => ConnectionStatus;
  getPrintForId: (id: string) => PrintFn;
};

export const PrinterContext = createContext<PrinterContextValue | null>(null);
