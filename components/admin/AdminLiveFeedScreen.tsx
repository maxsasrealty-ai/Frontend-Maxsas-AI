import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { fetchAdminLiveRecentEvents } from "../../lib/api/admin";
import { fetchCallDetail } from "../../lib/api/calls";
import { VoiceEventType } from "../../shared/contracts";

interface LiveEventItem {
  id: string;
  timestamp?: string;
  occurredAt?: string;
  streamEventId?: string;
  eventId?: string;
  tenantId?: string;
  callId?: string;
  roomId?: string;
  eventType?: VoiceEventType | string;
  stage: "received" | "invalid_json" | "validation_failed" | "persisted" | "duplicate" | "error";
  dbUpdated: boolean;
  message?: string;
  rawBody?: unknown;
  normalizedBody?: unknown;
}

interface AdminLiveFeedScreenProps {
  streamUrl: string;
}

function getEventIdentity(event: LiveEventItem): string {
  return event.eventId || event.streamEventId || event.id;
}

function getEventTimestamp(event: LiveEventItem): number {
  const timestamp = event.occurredAt || event.timestamp || "";
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortEventsByTimeDesc(events: LiveEventItem[]): LiveEventItem[] {
  return [...events].sort((a, b) => getEventTimestamp(b) - getEventTimestamp(a));
}

function mergeEvents(prev: LiveEventItem[], incoming: LiveEventItem | LiveEventItem[]): LiveEventItem[] {
  const nextItems = Array.isArray(incoming) ? incoming : [incoming];
  const merged = new Map<string, LiveEventItem>();

  for (const event of prev) {
    merged.set(getEventIdentity(event), event);
  }

  for (const event of nextItems) {
    merged.set(getEventIdentity(event), event);
  }

  return sortEventsByTimeDesc(Array.from(merged.values())).slice(0, 200);
}

function mapRecentDbEvent(event: {
  eventId: string;
  tenantId: string;
  callId: string;
  eventType: string;
  occurredAt: string;
  dbUpdated: true;
  payload: unknown;
  rawEnvelope: unknown;
}): LiveEventItem {
  return {
    id: event.eventId,
    streamEventId: event.eventId,
    eventId: event.eventId,
    tenantId: event.tenantId,
    callId: event.callId,
    eventType: event.eventType,
    occurredAt: event.occurredAt,
    timestamp: event.occurredAt,
    stage: "persisted",
    dbUpdated: event.dbUpdated,
    rawBody: event.rawEnvelope,
    normalizedBody: event.payload,
  };
}

export default function AdminLiveFeedScreen({ streamUrl }: AdminLiveFeedScreenProps) {
  const [events, setEvents] = useState<LiveEventItem[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<"All" | "Qualified" | "Neutral" | "Failed" | "Retry" | "Unknown">("All");
  const [selectedEvent, setSelectedEvent] = useState<LiveEventItem | null>(null);
  const [selectedCallDetail, setSelectedCallDetail] = useState<unknown>(null);
  const [loadingCallOutput, setLoadingCallOutput] = useState(false);
  const [callOutputError, setCallOutputError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const flatListRef = useRef<FlatList<LiveEventItem>>(null);

  const selectedCallEvents = useMemo(() => {
    if (!selectedEvent?.callId) {
      return [];
    }

    return events
      .filter((event) => event.callId === selectedEvent.callId)
      .sort((a, b) => {
        const aTs = Date.parse(a.occurredAt || a.timestamp || "");
        const bTs = Date.parse(b.occurredAt || b.timestamp || "");
        if (Number.isNaN(aTs) && Number.isNaN(bTs)) {
          return 0;
        }
        if (Number.isNaN(aTs)) {
          return -1;
        }
        if (Number.isNaN(bTs)) {
          return 1;
        }
        return aTs - bTs;
      });
  }, [events, selectedEvent?.callId]);

  const addEvent = useCallback((event: LiveEventItem) => {
    setEvents((prev) => mergeEvents(prev, event));
    // Auto-select first event only once; keep callback stable to avoid SSE reconnect loop.
    setSelectedEvent((prev) => prev ?? event);
  }, []);

  function getLeadBucketFromEvent(event: LiveEventItem): string | null {
    try {
      const body: any = event.normalizedBody ?? event.rawBody ?? {};
      return body?.lead_bucket ?? body?.leadBucket ?? null;
    } catch {
      return null;
    }
  }

  const hydrateRecentEvents = useCallback(async () => {
    const recentRes = await fetchAdminLiveRecentEvents(3);

    if (!recentRes.success || !Array.isArray(recentRes.data)) {
      return;
    }

    const mappedRecentEvents = recentRes.data.map(mapRecentDbEvent);
    setEvents((prev) => mergeEvents(prev, mappedRecentEvents));

    setSelectedEvent((prev) => prev ?? mappedRecentEvents[0] ?? null);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setSelectedEvent(null);
    setSelectedCallDetail(null);
    setCallOutputError(null);
  }, []);

  useEffect(() => {
    setConnecting(true);
    setError(null);

    const EventSourceImpl = (globalThis as { EventSource?: typeof EventSource }).EventSource;
    if (Platform.OS !== "web" || !EventSourceImpl) {
      setConnected(false);
      setConnecting(false);
      return;
    }

    const eventSource = new EventSourceImpl(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[LiveFeed] Connected to SSE stream");
      setConnected(true);
      setConnecting(false);
    };

    eventSource.onerror = (err) => {
      console.error("[LiveFeed] SSE connection error:", err);
      setConnected(false);
      setConnecting(false);
      setError("Connection lost. Reconnecting...");
    };

    eventSource.addEventListener("connected", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[LiveFeed] Server confirmed connection:", data);
      } catch (e) {
        console.warn("[LiveFeed] Failed to parse connected event:", e);
      }
    });

    eventSource.addEventListener("admin_live_event", (event) => {
      try {
        const data = JSON.parse(event.data) as LiveEventItem;
        const occurredAt = data.occurredAt || data.timestamp || new Date().toISOString();
        addEvent({
          ...data,
          id: data.eventId || data.streamEventId || data.id || `${Date.now()}-${Math.random()}`,
          occurredAt,
          timestamp: occurredAt,
        });
      } catch (e) {
        console.warn("[LiveFeed] Failed to parse live event:", e);
        addEvent({
          id: `${Date.now()}-${Math.random()}`,
          occurredAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          stage: "invalid_json",
          dbUpdated: false,
          message: "Failed to parse event data",
        });
      }
    });

    eventSource.addEventListener("heartbeat", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[LiveFeed] Heartbeat received:", data.ts);
      } catch {
        // Ignore heartbeat parse errors
      }
    });

    return () => {
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
    };
  }, [streamUrl, addEvent]);

  useEffect(() => {
    void hydrateRecentEvents();
  }, [hydrateRecentEvents]);

  useEffect(() => {
    const callId = selectedEvent?.callId;
    if (!callId) {
      setSelectedCallDetail(null);
      setCallOutputError(null);
      setLoadingCallOutput(false);
      return;
    }

    let mounted = true;
    setLoadingCallOutput(true);
    setCallOutputError(null);

    void (async () => {
      const detailRes = await fetchCallDetail(callId);

      if (!mounted) {
        return;
      }

      setSelectedCallDetail(detailRes.success ? detailRes.data : null);
      setCallOutputError(detailRes.success ? null : detailRes.error?.message || "Failed to load call detail");
      setLoadingCallOutput(false);
    })();

    return () => {
      mounted = false;
    };
  }, [selectedEvent?.callId]);

  const getStatusColor = (stage: LiveEventItem["stage"]) => {
    switch (stage) {
      case "persisted":
        return "#00D084"; // Green
      case "received":
        return "#4F8CFF"; // Blue
      case "duplicate":
        return "#A78BFA"; // Purple
      case "invalid_json":
      case "validation_failed":
      case "error":
        return "#FF6B6B"; // Red
      default:
        return "#8899A6"; // Gray
    }
  };

  const getEventTypeColor = (eventType?: string) => {
    if (!eventType) return "#8899A6";
    
    if (eventType.includes("transcript")) return "#4F8CFF";
    if (eventType.includes("call_started")) return "#00D084";
    if (eventType.includes("call_connected")) return "#00D084";
    if (eventType.includes("call_completed")) return "#A78BFA";
    if (eventType.includes("call_failed")) return "#FF6B6B";
    if (eventType.includes("lead_extracted")) return "#FFB800";
    
    return "#8899A6";
  };

  const formatTime = (value?: string) => {
    const timestamp = value || "";
    try {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) {
        return "Unknown Time";
      }
      return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "Unknown Time";
    }
  };

  const stringifyForPanel = (value: unknown) => {
    if (value === undefined || value === null) {
      return "null";
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const renderEvent = ({ item }: { item: LiveEventItem }) => {
    const isSelected = selectedEvent?.id === item.id;
    const leadBucket = getLeadBucketFromEvent(item);
    return (
    <Pressable
      onPress={() => setSelectedEvent(item)}
      style={[
        s.eventCard,
        { borderLeftColor: getStatusColor(item.stage) },
        isSelected ? s.eventCardSelected : null,
      ]}
    >
      <View style={s.eventHeader}>
        <View style={s.eventMeta}>
          <Text style={s.eventTime}>{formatTime(item.occurredAt || item.timestamp)}</Text>
          <View style={[s.stageBadge, { backgroundColor: getStatusColor(item.stage) + "20" }]}>
            <Text style={[s.stageText, { color: getStatusColor(item.stage) }]}>
              {item.stage.toUpperCase()}
            </Text>
          </View>
          {leadBucket && (
            <View style={[s.stageBadge, { backgroundColor: "rgba(136,153,166,0.08)" }]}>
              <Text style={[s.stageText, { color: "#8899A6" }]}>{leadBucket}</Text>
            </View>
          )}
          {item.dbUpdated && (
            <View style={[s.stageBadge, { backgroundColor: "#00D08420" }]}>
              <Text style={[s.stageText, { color: "#00D084" }]}>DB SAVED</Text>
            </View>
          )}
        </View>
      </View>

      {item.eventType && (
        <View style={s.eventTypeRow}>
          <View
            style={[
              s.eventTypeBadge,
              { backgroundColor: getEventTypeColor(item.eventType) + "20" },
            ]}
          >
            <Text
              style={[
                s.eventTypeText,
                { color: getEventTypeColor(item.eventType) },
              ]}
            >
              {item.eventType}
            </Text>
          </View>
        </View>
      )}

      {item.tenantId && (
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Tenant:</Text>
          <Text style={s.infoValue} numberOfLines={1}>
            {item.tenantId}
          </Text>
        </View>
      )}

      {item.callId && (
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Call ID:</Text>
          <Text style={s.infoValue} numberOfLines={1}>
            {item.callId}
          </Text>
        </View>
      )}

      {item.message && (
        <View style={s.messageContainer}>
          <Text style={s.messageText}>{item.message}</Text>
        </View>
      )}

      {item.rawBody && (
        <View style={s.rawDataContainer}>
          <Text style={s.rawDataLabel}>Raw Data:</Text>
          <Text style={s.rawDataText} numberOfLines={3}>
            {JSON.stringify(item.rawBody, null, 2).slice(0, 200)}
            {JSON.stringify(item.rawBody).length > 200 ? "..." : ""}
          </Text>
        </View>
      )}
      <Text style={s.tapHint}>Tap to view full call output</Text>
    </Pressable>
  );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title}>Live Call Feed</Text>
          <View style={s.statusContainer}>
            <View
              style={[
                s.statusDot,
                {
                  backgroundColor: connecting
                    ? "#FFB800"
                    : connected
                    ? "#00D084"
                    : "#FF6B6B",
                },
              ]}
            />
            <Text style={s.statusText}>
              {connecting ? "Connecting..." : connected ? "Live" : "Disconnected"}
            </Text>
          </View>
        </View>

        <View style={s.headerRight}>
          <View style={s.countBadge}>
            <Text style={s.countText}>{events.length}</Text>
          </View>
          <Pressable
            style={[s.clearButton, { opacity: events.length > 0 ? 1 : 0.5 }]}
            onPress={clearEvents}
            disabled={events.length === 0}
          >
            <Text style={s.clearButtonText}>Reset</Text>
          </Pressable>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {/* Lead bucket tabs */}
      <View style={s.bucketTabs}>
        {(["All", "Qualified", "Neutral", "Failed", "Retry", "Unknown"] as const).map((b) => (
          <Pressable
            key={b}
            onPress={() => setSelectedBucket(b)}
            style={[
              s.bucketTab,
              selectedBucket === b ? s.bucketTabActive : null,
            ]}
          >
            <Text style={selectedBucket === b ? s.bucketTabTextActive : s.bucketTabText}>{b}</Text>
          </Pressable>
        ))}
      </View>

      {selectedEvent && (
        <View style={s.detailPanel}>
          <View style={s.detailHeaderRow}>
            <Text style={s.detailTitle}>Selected Call Output</Text>
            <Text style={s.detailMeta}>
              {selectedEvent.callId ? `Call ID: ${selectedEvent.callId}` : "No Call ID"}
            </Text>
          </View>

          {loadingCallOutput && <Text style={s.detailStatusText}>Loading full call output...</Text>}
          {callOutputError && <Text style={s.detailErrorText}>{callOutputError}</Text>}

          <ScrollView style={s.detailScroll} contentContainerStyle={s.detailScrollContent}>
            <Text style={s.detailSectionTitle}>Call Timeline</Text>
            <Text style={s.detailJsonBlock}>
              {stringifyForPanel(
                selectedCallEvents.map((event) => ({
                  eventId: event.eventId,
                  eventType: event.eventType,
                  stage: event.stage,
                  occurredAt: event.occurredAt || event.timestamp,
                  dbUpdated: event.dbUpdated,
                  normalizedBody: event.normalizedBody,
                }))
              )}
            </Text>

            <Text style={s.detailSectionTitle}>Call Detail API Output</Text>
            <Text style={s.detailJsonBlock}>{stringifyForPanel(selectedCallDetail)}</Text>

            <Text style={s.detailSectionTitle}>Selected Event Raw Input</Text>
            <Text style={s.detailJsonBlock}>{stringifyForPanel(selectedEvent.rawBody)}</Text>

            <Text style={s.detailSectionTitle}>Selected Event Normalized Output</Text>
            <Text style={s.detailJsonBlock}>{stringifyForPanel(selectedEvent.normalizedBody)}</Text>
          </ScrollView>
        </View>
      )}

      {/* Events List */}
      {connecting && events.length === 0 ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#4F8CFF" />
          <Text style={s.loadingText}>Connecting to live feed...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={s.emptyContainer}>
          <Text style={s.emptyTitle}>No Events Yet</Text>
          <Text style={s.emptyText}>
            Waiting for incoming call events...
          </Text>
        </View>
      ) : (
        (() => {
          const displayedEvents = events.filter((ev) => {
            if (selectedBucket === "All") return true;
            const b = getLeadBucketFromEvent(ev);
            return b === selectedBucket;
          });

          return (
            <FlatList
              ref={flatListRef}
              data={displayedEvents}
              renderItem={renderEvent}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.listContent}
              inverted={false}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={Platform.OS === "android"}
            />
          );
        })()
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050d1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(79,140,255,0.2)",
    backgroundColor: "rgba(11,24,42,0.96)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: "#E8EDF5",
    fontSize: 18,
    fontWeight: "700",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "#8899A6",
    fontSize: 12,
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: "rgba(79,140,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: "#4F8CFF",
    fontSize: 12,
    fontWeight: "700",
  },
  clearButton: {
    backgroundColor: "rgba(255,107,107,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
  },
  clearButtonText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "rgba(255,107,107,0.1)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,107,107,0.2)",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#8899A6",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#E8EDF5",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    color: "#8899A6",
    fontSize: 14,
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  eventCard: {
    backgroundColor: "rgba(11,24,42,0.8)",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
  },
  eventCardSelected: {
    borderWidth: 1,
    borderColor: "rgba(0,208,132,0.8)",
    backgroundColor: "rgba(11,24,42,0.95)",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  eventTime: {
    color: "#8899A6",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  stageText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  eventTypeRow: {
    marginBottom: 8,
  },
  eventTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoLabel: {
    color: "#8899A6",
    fontSize: 11,
    fontWeight: "600",
  },
  infoValue: {
    color: "#E8EDF5",
    fontSize: 11,
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  messageContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(136,153,166,0.2)",
  },
  messageText: {
    color: "#E8EDF5",
    fontSize: 12,
    lineHeight: 16,
  },
  rawDataContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(136,153,166,0.2)",
  },
  rawDataLabel: {
    color: "#8899A6",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rawDataText: {
    color: "#A0AEC0",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  tapHint: {
    color: "#4F8CFF",
    fontSize: 11,
    marginTop: 10,
    fontWeight: "600",
  },
  detailPanel: {
    maxHeight: 360,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(79,140,255,0.35)",
    borderRadius: 10,
    backgroundColor: "rgba(7,17,31,0.96)",
    overflow: "hidden",
  },
  detailHeaderRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(79,140,255,0.2)",
    gap: 4,
  },
  detailTitle: {
    color: "#E8EDF5",
    fontWeight: "700",
    fontSize: 14,
  },
  detailMeta: {
    color: "#8899A6",
    fontSize: 12,
  },
  detailStatusText: {
    color: "#4F8CFF",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  detailErrorText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 10,
    gap: 8,
  },
  detailSectionTitle: {
    color: "#00D084",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailJsonBlock: {
    color: "#CFE0FF",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "rgba(15,29,48,0.9)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(79,140,255,0.2)",
    padding: 10,
  },
  bucketTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(79,140,255,0.06)",
    backgroundColor: "rgba(7,17,31,0.96)",
  },
  bucketTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(136,153,166,0.08)",
  },
  bucketTabActive: {
    backgroundColor: "rgba(79,140,255,0.12)",
    borderColor: "rgba(79,140,255,0.28)",
  },
  bucketTabText: {
    color: "#8899A6",
    fontSize: 12,
    fontWeight: "700",
  },
  bucketTabTextActive: {
    color: "#4F8CFF",
    fontSize: 12,
    fontWeight: "700",
  },
});