import { PaperSize } from "./PrinterProvider.enum";

export type PrinterConnectionOptions = {
  devId?: string;
  requestTimeoutMs?: number;
  useHttps?: boolean;
};

export type PrinterConfig = {
  id: string;
  printerIp: string;
  paperSize: PaperSize;
  options?: PrinterConnectionOptions;
};
