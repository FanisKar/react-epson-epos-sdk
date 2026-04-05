import { createContext } from "react";
import type { RefObject } from "react";
import type { Printer } from "../../components/Printer";
import type { PrintResult } from "../PrinterProvider.enum";
import type { PrinterRuntimeState } from "./internalTypes";

export type PrinterContextValue = {
  printerIdSet: ReadonlySet<string>;
  instancesRef: RefObject<Map<string, Printer>>;
  instanceEpoch: number;
  printerStates: Record<string, PrinterRuntimeState | undefined>;
  printForId: (id: string, opts?: { retryOnError?: boolean }) => Promise<{ printResult: PrintResult }>;
};

export const PrinterContext = createContext<PrinterContextValue | null>(null);
