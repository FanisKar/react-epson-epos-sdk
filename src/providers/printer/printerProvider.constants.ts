/**
 * Heartbeat cadence while the printer last reported as CONNECTED. Long cadence
 * keeps network chatter low when everything is healthy.
 */
export const PRINTER_HEARTBEAT_CONNECTED_INTERVAL_MS = 60_000;

/**
 * Heartbeat cadence while the printer is not CONNECTED (DISCONNECTED, ERROR, or
 * initial state). Short cadence ensures fast detection of recovery.
 */
export const PRINTER_HEARTBEAT_DISCONNECTED_INTERVAL_MS = 5_000;

/** Max failed jobs kept per printer id while offline. Oldest entries are dropped. */
export const MAX_QUEUED_JOBS_PER_PRINTER = 100;

