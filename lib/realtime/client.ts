import { RealtimeCallEvent } from "../../shared/contracts";
import { parseRealtimeCallEvent } from "../adapters/liveEvents";
import { resolveApiBaseUrl } from "../api/base-url";

export type RealtimeConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "unsupported"
  | "closed";

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface RealtimeClient {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribeToCallEvents: (
    tenantId: string,
    onEvent: (event: RealtimeCallEvent) => void,
    onStateChange?: (state: RealtimeConnectionState) => void
  ) => RealtimeSubscription;
}

type Listener = {
  onEvent: (event: RealtimeCallEvent) => void;
  onStateChange?: (state: RealtimeConnectionState) => void;
};

export class SseRealtimeClient implements RealtimeClient {
  private source: EventSource | null = null;
  private tenantId: string | null = null;
  private listeners = new Set<Listener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;

  constructor(private readonly baseApiUrl: string) {}

  async connect(): Promise<void> {
    return;
  }

  async disconnect(): Promise<void> {
    this.notifyState("closed");
    this.teardownSource();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  subscribeToCallEvents(
    tenantId: string,
    onEvent: (event: RealtimeCallEvent) => void,
    onStateChange?: (state: RealtimeConnectionState) => void
  ): RealtimeSubscription {
    const listener: Listener = { onEvent, onStateChange };
    this.listeners.add(listener);
    this.tenantId = tenantId;
    this.ensureConnected();

    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
        if (this.listeners.size === 0) {
          this.teardownSource();
        }
      },
    };
  }

  private ensureConnected(): void {
    if (!this.tenantId || this.source || this.listeners.size === 0) {
      return;
    }

    const EventSourceImpl = (globalThis as { EventSource?: typeof EventSource }).EventSource;
    if (!EventSourceImpl) {
      this.notifyState("unsupported");
      return;
    }

    const normalizedBase = this.baseApiUrl.replace(/\/$/, "");
    const url = `${normalizedBase}/realtime/calls/stream?tenantId=${encodeURIComponent(this.tenantId)}`;

    this.notifyState(this.reconnectAttempt > 0 ? "reconnecting" : "connecting");

    const source = new EventSourceImpl(url);
    this.source = source;

    source.onopen = () => {
      this.reconnectAttempt = 0;
      this.notifyState("connected");
    };

    source.onerror = () => {
      this.notifyState("reconnecting");
      this.teardownSource();
      this.scheduleReconnect();
    };

    source.addEventListener("call_event", (evt) => {
      const data = (evt as MessageEvent).data;
      if (!data || typeof data !== "string") {
        return;
      }

      try {
        const parsed = parseRealtimeCallEvent(data);
        if (!parsed) {
          return;
        }

        this.listeners.forEach((listener) => listener.onEvent(parsed));
      } catch {
        // Ignore malformed payloads to keep stream alive.
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.listeners.size === 0) {
      return;
    }

    this.reconnectAttempt += 1;
    const backoff = Math.min(1000 * 2 ** Math.min(this.reconnectAttempt, 4), 15000);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureConnected();
    }, backoff);
  }

  private teardownSource(): void {
    if (!this.source) {
      return;
    }

    this.source.close();
    this.source = null;
  }

  private notifyState(state: RealtimeConnectionState): void {
    this.listeners.forEach((listener) => {
      listener.onStateChange?.(state);
    });
  }
}

const defaultApiBaseUrl = resolveApiBaseUrl();
export const realtimeClient: RealtimeClient = new SseRealtimeClient(defaultApiBaseUrl);
