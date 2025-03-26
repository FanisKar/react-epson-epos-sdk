import { FC, ReactNode, useState, useEffect, createContext, useRef, useContext, useCallback } from "react";
import dayjs, { Dayjs } from "dayjs";
import { ConnectionStatus, PaperSize, PrintResult } from "./PrinterProvider.enum";
import { Printer } from "../components/Printer";

const HEART_BEAT_INTERVAL = 5000;

const PrinterContext = createContext<{
  status: ConnectionStatus;
  printer: Printer | undefined;
  print: ({ retryOnError }?: { retryOnError: boolean }) => Promise<{ printResult: PrintResult }>;
}>({
  status: ConnectionStatus.DISCONNECTED,
  printer: undefined,
  print: () => {
    throw new Error("Function not implemented");
  },
});

export const PrinterProvider: FC<{ children: ReactNode; printerIp: string | null; isDebugMode?: boolean; paperSize: PaperSize }> = ({
  children,
  printerIp,
  isDebugMode,
  paperSize,
}) => {
  const printer = useRef<Printer | undefined>(undefined);
  const timeoutRef = useRef<number | null>(null);

  const [unprintedData, setUnprintedData] = useState<{ data: string[] }[]>([]);

  const [connection, setConnection] = useState<{ status: ConnectionStatus; timestamp: Dayjs | null }>({
    status: ConnectionStatus.DISCONNECTED,
    timestamp: null,
  });

  const setStatus = (status: ConnectionStatus) => {
    setConnection({ status, timestamp: dayjs() });
  };

  useEffect(() => {
    if (connection.status !== ConnectionStatus.DISCONNECTED || !printerIp) return;

    const printerObj = new Printer(printerIp, paperSize);
    printer.current = printerObj;
  }, [connection.status, printerIp]);

  useEffect(() => {
    if (!printer.current) return;
    const checkStatus = async () => {
      const isOnline = await printer.current?.checkOnline();
      setStatus(isOnline ? ConnectionStatus.CONNECTED : ConnectionStatus.ERROR);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(checkStatus, HEART_BEAT_INTERVAL) as unknown as number;
    };

    checkStatus();

    return () => {
      if (!timeoutRef.current) return;
      clearInterval(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [printerIp]);

  useEffect(() => {
    if (!isDebugMode) return;
    console.log("Unprinted data:", unprintedData);
  }, [unprintedData, isDebugMode]);

  useEffect(() => {
    if (!isDebugMode) return;
    console.log("Printer status:", connection.status);
  }, [connection.status, isDebugMode]);

  const print = useCallback(
    async ({ retryOnError }: { retryOnError?: boolean } = { retryOnError: true }): Promise<{ printResult: PrintResult }> => {
      const execPrint = async () => {
        if (!printer.current) {
          return { printResult: PrintResult.ERROR };
        }
        try {
          await printer.current.send();
          return { printResult: PrintResult.SUCCESS };
        } catch {
          return { printResult: PrintResult.ERROR };
        }
      };

      const { printResult } = await execPrint();

      if (printResult === PrintResult.ERROR) {
        if (connection.status !== ConnectionStatus.ERROR) setStatus(ConnectionStatus.ERROR);
        const xmlChunks = printer.current?.getXmlChunks();
        if (xmlChunks && retryOnError) {
          printer.current?.setXmlChunks([]);
          setUnprintedData(prev => [...(prev || []), { data: xmlChunks }]);
        }
      }
      return { printResult };
    },
    [connection.status]
  );

  useEffect(() => {
    if (connection.status !== ConnectionStatus.CONNECTED) return;
    if (!unprintedData.length) return;
    printer.current?.setXmlChunks(unprintedData[0].data);
    console.log("Printing unprinted data...");
    print();
    setUnprintedData(prev => prev.slice(1));
  }, [connection.status, print, unprintedData]);

  const value = { status: connection.status, print, printer: printer.current };

  return <PrinterContext.Provider value={value}> {children} </PrinterContext.Provider>;
};

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error("usePrinter must be used within a PrinterProvider");
  }
  return context;
};
