import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Printer } from "../../components/Printer";
import type { PrinterConfig } from "../printer.types";
import { buildPrintersKey, getPrinterConfigFingerprint } from "./printerConfig.utils";
import { createPrintForId } from "./createPrintForId";
import type { PrinterRuntimeState, UnprintedQueueEntry } from "./internalTypes";
import { ConnectionStatus, PrintResult } from "../PrinterProvider.enum";
import dayjs from "dayjs";

export type PrintFn = (opts?: { retryOnError?: boolean }) => Promise<{ printResult: PrintResult }>;

export type PrinterRegistry = {
  printersRef: RefObject<PrinterConfig[]>;
  printersKey: string;
  printerIdSet: ReadonlySet<string>;
  instanceEpoch: number;
  instancesRef: RefObject<Map<string, Printer>>;
  /** Source of truth for per-id status. Read via `getStatusForId`; mutate via `setStatusForId`. */
  statusByIdRef: RefObject<Map<string, PrinterRuntimeState>>;
  /** Bumps on every real status change. Used as a re-run trigger by internal effects; NOT exposed to consumers. */
  statusVersion: number;
  subscribeToStatus: (id: string, callback: () => void) => () => void;
  getStatusForId: (id: string) => ConnectionStatus;
  unprintedById: Record<string, UnprintedQueueEntry[]>;
  setStatusForId: (id: string, status: ConnectionStatus) => void;
  printForId: ReturnType<typeof createPrintForId>;
  /** Returns a stable per-id `print` wrapper. Same reference across renders for the same id. */
  getPrintForId: (id: string) => PrintFn;
  setUnprintedById: Dispatch<SetStateAction<Record<string, UnprintedQueueEntry[]>>>;
};

/**
 * Holds printer instances, the per-id status store, retry queues, and `printForId`.
 * Status lives in a ref-backed pub/sub store so heartbeat ticks don't re-render
 * consumers of unrelated ids. `printersKey` only changes when the effective
 * printer list/config changes (not when the array reference alone changes).
 */
export function usePrinterRegistry(printers: PrinterConfig[], testMode = false): PrinterRegistry {
  const printersRef = useRef(printers);
  printersRef.current = printers;

  const printersKey = useMemo(() => buildPrintersKey(printers), [printers]);

  const printerIdSet = useMemo(() => new Set(printersRef.current.map(p => p.id)), [printersKey]);

  const instancesRef = useRef(new Map<string, Printer>());
  const configFingerprintsRef = useRef(new Map<string, string>());
  const lastOpByIdRef = useRef(new Map<string, Promise<void>>());
  const [instanceEpoch, setInstanceEpoch] = useState(0);

  const statusByIdRef = useRef(new Map<string, PrinterRuntimeState>());
  const subscribersByIdRef = useRef(new Map<string, Set<() => void>>());
  const [statusVersion, setStatusVersion] = useState(0);

  const printFnByIdRef = useRef(new Map<string, PrintFn>());

  const [unprintedById, setUnprintedById] = useState<Record<string, UnprintedQueueEntry[]>>({});

  const subscribeToStatus = useCallback((id: string, callback: () => void) => {
    let subs = subscribersByIdRef.current.get(id);
    if (!subs) {
      subs = new Set();
      subscribersByIdRef.current.set(id, subs);
    }
    subs.add(callback);
    return () => {
      const set = subscribersByIdRef.current.get(id);
      if (!set) return;
      set.delete(callback);
      if (set.size === 0) subscribersByIdRef.current.delete(id);
    };
  }, []);

  const getStatusForId = useCallback((id: string): ConnectionStatus => {
    return statusByIdRef.current.get(id)?.status ?? ConnectionStatus.DISCONNECTED;
  }, []);

  const setStatusForId = useCallback((id: string, status: ConnectionStatus) => {
    const prev = statusByIdRef.current.get(id);
    statusByIdRef.current.set(id, { status, timestamp: dayjs() });
    // Timestamp is always refreshed; subscribers are only notified on real status changes.
    if (prev?.status === status) return;
    setStatusVersion(v => v + 1);
    subscribersByIdRef.current.get(id)?.forEach(cb => cb());
  }, []);

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
        statusByIdRef.current.delete(id);
        subscribersByIdRef.current.delete(id);
        printFnByIdRef.current.delete(id);
        changed = true;
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

  const printForId = useMemo(
    () => createPrintForId({ instancesRef, printersRef, lastOpByIdRef, testMode, setStatusForId, setUnprintedById }),
    [instancesRef, printersRef, lastOpByIdRef, testMode, setStatusForId, setUnprintedById]
  );

  // Stable handle to the latest `printForId` so cached per-id wrappers never need to be rebuilt.
  const printForIdRef = useRef(printForId);
  printForIdRef.current = printForId;

  const getPrintForId = useCallback((id: string): PrintFn => {
    let fn = printFnByIdRef.current.get(id);
    if (!fn) {
      fn = opts => printForIdRef.current(id, opts);
      printFnByIdRef.current.set(id, fn);
    }
    return fn;
  }, []);

  return useMemo(
    () => ({
      printersRef,
      printersKey,
      printerIdSet,
      instanceEpoch,
      instancesRef,
      statusByIdRef,
      statusVersion,
      subscribeToStatus,
      getStatusForId,
      unprintedById,
      setStatusForId,
      printForId,
      getPrintForId,
      setUnprintedById,
    }),
    [
      printersRef,
      printersKey,
      printerIdSet,
      instanceEpoch,
      instancesRef,
      statusByIdRef,
      statusVersion,
      subscribeToStatus,
      getStatusForId,
      unprintedById,
      setStatusForId,
      printForId,
      getPrintForId,
    ]
  );
}
