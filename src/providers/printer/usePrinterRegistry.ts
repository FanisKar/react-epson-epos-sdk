import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Printer } from "../../components/Printer";
import type { PrinterConfig } from "../printer.types";
import { buildPrintersKey, getPrinterConfigFingerprint } from "./printerConfig.utils";
import { createPrintForId } from "./createPrintForId";
import type { PrinterRuntimeState, UnprintedQueueEntry } from "./internalTypes";
import { ConnectionStatus } from "../PrinterProvider.enum";
import dayjs from "dayjs";

export type PrinterRegistry = {
  printersRef: RefObject<PrinterConfig[]>;
  printersKey: string;
  printerIdSet: ReadonlySet<string>;
  instanceEpoch: number;
  instancesRef: RefObject<Map<string, Printer>>;
  printerStates: Record<string, PrinterRuntimeState | undefined>;
  unprintedById: Record<string, UnprintedQueueEntry[]>;
  setStatusForId: (id: string, status: ConnectionStatus) => void;
  printForId: ReturnType<typeof createPrintForId>;
  setUnprintedById: Dispatch<SetStateAction<Record<string, UnprintedQueueEntry[]>>>;
};

/**
 * Holds printer instances, connection snapshots, retry queues, and `printForId`.
 * `printersKey` changes only when the effective printer list/config changes (not when the array reference alone changes).
 */
export function usePrinterRegistry(printers: PrinterConfig[]): PrinterRegistry {
  const printersRef = useRef(printers);
  printersRef.current = printers;

  const printersKey = useMemo(() => buildPrintersKey(printers), [printers]);

  const printerIdSet = useMemo(() => new Set(printersRef.current.map(p => p.id)), [printersKey]);

  const instancesRef = useRef(new Map<string, Printer>());
  const configFingerprintsRef = useRef(new Map<string, string>());
  const [instanceEpoch, setInstanceEpoch] = useState(0);

  const [printerStates, setPrinterStates] = useState<Record<string, PrinterRuntimeState | undefined>>({});
  const [unprintedById, setUnprintedById] = useState<Record<string, UnprintedQueueEntry[]>>({});

  useLayoutEffect(() => {
    const list = printersRef.current;
    const nextIds = new Set(list.map(p => p.id));
    const map = instancesRef.current;
    const fpMap = configFingerprintsRef.current;
    let changed = false;

    for (const id of [...map.keys()]) {
      if (!nextIds.has(id)) {
        map.delete(id);
        fpMap.delete(id);
        changed = true;
        setPrinterStates(prev => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setUnprintedById(prev => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    }

    for (const p of list) {
      const fp = getPrinterConfigFingerprint(p);
      const prevFp = fpMap.get(p.id);
      if (prevFp !== fp) {
        fpMap.set(p.id, fp);
        map.set(p.id, new Printer(p.printerIp, p.paperSize, p.options));
        changed = true;
      }
    }

    if (changed) {
      setInstanceEpoch(e => e + 1);
    }
  }, [printersKey]);

  const setStatusForId = useCallback((id: string, status: ConnectionStatus) => {
    setPrinterStates(prev => ({
      ...prev,
      [id]: { status, timestamp: dayjs() },
    }));
  }, []);

  const printForId = useMemo(
    () => createPrintForId({ instancesRef, setPrinterStates, setUnprintedById }),
    [instancesRef, setPrinterStates, setUnprintedById]
  );

  return useMemo(
    () => ({
      printersRef,
      printersKey,
      printerIdSet,
      instanceEpoch,
      instancesRef,
      printerStates,
      unprintedById,
      setStatusForId,
      printForId,
      setUnprintedById,
    }),
    [
      printersRef,
      printersKey,
      printerIdSet,
      instanceEpoch,
      instancesRef,
      printerStates,
      unprintedById,
      setStatusForId,
      printForId,
    ]
  );
}
