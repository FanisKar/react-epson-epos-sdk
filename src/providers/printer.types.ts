import { PaperSize } from "./PrinterProvider.enum";

export type PrinterConnectionOptions = {
  devId?: string;
  /** Client + URL timeout for heartbeat / online checks. Default: 5000 ms. */
  requestTimeoutMs?: number;
  /** Client + URL timeout for print jobs. Default: 20000 ms. */
  printRequestTimeoutMs?: number;
  useHttps?: boolean;
};

export type PrinterConfig = {
  id: string;
  printerIp: string;
  paperSize: PaperSize;
  options?: PrinterConnectionOptions;
};
