import type { Dayjs } from "dayjs";
import type { ConnectionStatus } from "../PrinterProvider.enum";

export type PrinterRuntimeState = {
  status: ConnectionStatus;
  timestamp: Dayjs | null;
};

export type UnprintedQueueEntry = { data: string[] };
