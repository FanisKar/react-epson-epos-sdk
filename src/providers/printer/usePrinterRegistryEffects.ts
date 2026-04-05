import { useEffect, useLayoutEffect } from "react";
import { ConnectionStatus } from "../PrinterProvider.enum";
import { PRINTER_HEARTBEAT_INTERVAL_MS } from "./printerProvider.constants";
import type { PrinterRegistry } from "./usePrinterRegistry";

/** In test mode, mark every configured printer as connected without network calls. */
function useTestModePrinterStatus(registry: PrinterRegistry, testMode: boolean | undefined): void {
  const { printersKey, printersRef, setStatusForId } = registry;

  useLayoutEffect(() => {
    if (!testMode) return;
    for (const p of printersRef.current) {
      setStatusForId(p.id, ConnectionStatus.CONNECTED);
    }
  }, [printersKey, testMode, printersRef, setStatusForId]);
}

/** Polls each printer on an interval and updates `printerStates[id].status`. */
function usePrinterHeartbeats(registry: PrinterRegistry, testMode: boolean | undefined): void {
  const { printersKey, printersRef, instancesRef, setStatusForId } = registry;

  useEffect(() => {
    if (testMode) return;

    const list = printersRef.current;
    const pendingTimeouts: number[] = [];
    let cancelled = false;

    const startHeartbeat = (id: string) => {
      const tick = async () => {
        if (cancelled) return;
        const printer = instancesRef.current.get(id);
        if (!printer) return;
        const isOnline = await printer.checkOnline();
        if (cancelled) return;
        setStatusForId(id, isOnline ? ConnectionStatus.CONNECTED : ConnectionStatus.ERROR);
        if (cancelled) return;
        const tid = window.setTimeout(() => void tick(), PRINTER_HEARTBEAT_INTERVAL_MS);
        pendingTimeouts.push(tid);
      };
      void tick();
    };

    for (const p of list) {
      startHeartbeat(p.id);
    }

    return () => {
      cancelled = true;
      pendingTimeouts.forEach(clearTimeout);
    };
  }, [printersKey, testMode, printersRef, instancesRef, setStatusForId]);
}

/** When a printer reconnects, flushes one queued failed job per tick (same idea as v1). */
function useFlushUnprintedOnReconnect(registry: PrinterRegistry, isDebugMode: boolean | undefined): void {
  const { printersRef, printerStates, unprintedById, instancesRef, printForId, printersKey, setUnprintedById } = registry;

  useEffect(() => {
    const list = printersRef.current;
    const flushJobs: { id: string; data: string[] }[] = [];

    for (const p of list) {
      const id = p.id;
      if (printerStates[id]?.status !== ConnectionStatus.CONNECTED) continue;
      const queue = unprintedById[id];
      if (!queue?.length) continue;
      const printer = instancesRef.current.get(id);
      if (!printer) continue;
      flushJobs.push({ id, data: queue[0].data });
    }

    if (!flushJobs.length) return;

    for (const job of flushJobs) {
      const printer = instancesRef.current.get(job.id);
      if (!printer) continue;
      printer.setXmlChunks(job.data);
      if (isDebugMode) console.log(`Printing unprinted data for "${job.id}"...`);
      void printForId(job.id);
    }

    setUnprintedById(prev => {
      let next = prev;
      let mutated = false;
      for (const job of flushJobs) {
        const q = (mutated ? next : prev)[job.id];
        if (!q?.length) continue;
        if (!mutated) {
          next = { ...prev };
          mutated = true;
        }
        next[job.id] = q.slice(1);
      }
      return mutated ? next : prev;
    });
  }, [printerStates, unprintedById, printersKey, printForId, isDebugMode, printersRef, instancesRef, setUnprintedById]);
}

function useDebugPrinterLogs(registry: PrinterRegistry, isDebugMode: boolean | undefined): void {
  const { unprintedById, printerStates } = registry;

  useEffect(() => {
    if (!isDebugMode) return;
    console.log("Unprinted data by printer:", unprintedById);
  }, [unprintedById, isDebugMode]);

  useEffect(() => {
    if (!isDebugMode) return;
    console.log("Printer status:", printerStates);
  }, [printerStates, isDebugMode]);
}

/** Side effects owned by the provider: heartbeats, retry flush, optional logging. */
export function usePrinterRegistryEffects(
  registry: PrinterRegistry,
  isDebugMode?: boolean,
  testMode?: boolean
): void {
  useTestModePrinterStatus(registry, testMode);
  usePrinterHeartbeats(registry, testMode);
  useFlushUnprintedOnReconnect(registry, isDebugMode);
  useDebugPrinterLogs(registry, isDebugMode);
}
