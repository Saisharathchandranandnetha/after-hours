"use client";

import { useEffect, useRef, useState } from "react";
import { firebaseConfig } from "@/lib/firebase";

const LOCAL_STORAGE_KEY = "after-hours-open-tabs";
const BROADCAST_CHANNEL_NAME = "after-hours-presence-channel";
const HEARTBEAT_INTERVAL_MS = 2_000;
const TAB_EXPIRATION_MS = 5_000;

interface TabRegistry {
  [tabId: string]: number; // tabId -> timestamp
}

export function useStudioPresence() {
  const [count, setCount] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return 1;
      const registry: TabRegistry = JSON.parse(raw);
      return Math.max(1, Object.keys(registry).length);
    } catch {
      return 1;
    }
  });
  const tabIdRef = useRef<string>("");
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Generate unique tab ID for this browser tab instance
    const tabId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? `tab_${crypto.randomUUID()}`
        : `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    tabIdRef.current = tabId;

    let isMounted = true;

    // Helper: update and clean local tab registry in localStorage
    const syncLocalTabs = (): number => {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const registry: TabRegistry = raw ? JSON.parse(raw) : {};
        const now = Date.now();

        // Refresh this tab's heartbeat
        registry[tabId] = now;

        // Prune expired tabs (closed without unmount / crashed)
        for (const [id, lastSeen] of Object.entries(registry)) {
          if (now - lastSeen > TAB_EXPIRATION_MS) {
            delete registry[id];
          }
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(registry));
        return Math.max(1, Object.keys(registry).length);
      } catch {
        return 1;
      }
    };

    // Helper: remove this tab on exit
    const leaveLocalTabs = () => {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const registry: TabRegistry = JSON.parse(raw);
          delete registry[tabId];
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(registry));
        }
      } catch {
        // Ignored
      }
    };

    // 1. Initial Local Sync
    syncLocalTabs();

    // 2. BroadcastChannel for instant inter-tab messaging (0ms sync)
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event: MessageEvent) => {
          if (!event.data || typeof event.data !== "object") return;
          const { type } = event.data;
          if (type === "SYNC" || type === "LEAVE") {
            const active = syncLocalTabs();
            if (isMounted) setCount(active);
          }
        };

        // Notify other tabs immediately
        channel.postMessage({ type: "SYNC", tabId });
      } catch {
        // BroadcastChannel unavailable fallback
      }
    }

    // 3. Storage event listener (fires when other tabs update localStorage in the same browser)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && isMounted) {
        const active = syncLocalTabs();
        setCount(active);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 4. Cross-browser presence via Firestore REST API (if available)
    const syncFirestorePresence = async () => {
      const { projectId, apiKey } = firebaseConfig;
      if (!projectId || !apiKey) return;

      const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/presence/${tabId}?key=${apiKey}`;
      const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/presence?key=${apiKey}`;

      try {
        // Write this tab's heartbeat to Firestore (compliant with firestore.rules timestamp schema)
        await fetch(docUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              lastSeen: { timestampValue: new Date().toISOString() },
              tabId: { stringValue: tabId },
              status: { stringValue: "online" },
            },
          }),
        });

        // Query active presence collection
        const res = await fetch(listUrl, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.documents)) {
            const now = Date.now();
            let liveRemoteCount = 0;
            for (const doc of data.documents) {
              const lastSeenIso = doc.fields?.lastSeen?.timestampValue;
              const lastSeenVal = lastSeenIso ? Date.parse(lastSeenIso) : 0;
              const status = doc.fields?.status?.stringValue || "online";
              if (status !== "offline" && now - lastSeenVal < 15_000) {
                liveRemoteCount++;
              }
            }
            if (isMounted) {
              const local = syncLocalTabs();
              setCount(Math.max(local, liveRemoteCount, 1));
            }
          }
        }
      } catch {
        // Fallback silently to local tabs count
      }
    };

    // Run first Firestore check
    syncFirestorePresence().catch(() => {});

    // 5. Heartbeat loop (every 2 seconds)
    const interval = setInterval(() => {
      const active = syncLocalTabs();
      if (isMounted) {
        setCount((prev) => Math.max(active, prev));
      }
      syncFirestorePresence().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    // 6. Clean departure on tab close / reload
    const handleUnload = () => {
      leaveLocalTabs();
      if (channelRef.current) {
        try {
          channelRef.current.postMessage({ type: "LEAVE", tabId });
        } catch {
          // Ignored
        }
      }

      // Delete document from Firestore immediately on departure
      const { projectId, apiKey } = firebaseConfig;
      if (projectId && apiKey) {
        const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/presence/${tabId}?key=${apiKey}`;
        try {
          fetch(docUrl, { method: "DELETE", keepalive: true }).catch(() => {});
        } catch {
          // Ignored
        }
      }
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      isMounted = false;
      clearInterval(interval);
      handleUnload();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      if (channelRef.current) {
        try {
          channelRef.current.close();
        } catch {
          // Ignored
        }
      }
    };
  }, []);

  return { count };
}
