import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentSlotQueryKey, getGetAuctionBidsQueryKey, getGetAuctionQueryKey } from "@workspace/api-client-react";

export interface TimerState {
  remaining: number;
  total: number;
  expired: boolean;
  paused?: boolean;
}

export function useAuctionSocket(auctionId?: number) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: unknown } | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  const joinAuction = useCallback((socket: Socket, id: number) => {
    socket.emit("join:auction", id);
  }, []);

  useEffect(() => {
    const socket = io("/api", {
      transports: ["websocket", "polling"],
      reconnection: true,
      path: "/api/socket.io",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (auctionId) joinAuction(socket, auctionId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("reconnect", () => {
      if (auctionId) joinAuction(socket, auctionId);
    });

    // ── Timer events ─────────────────────────────────────────────
    socket.on("timer:update", (payload: TimerState) => {
      setTimerState(payload);
    });

    socket.on("timer:expired", (payload: unknown) => {
      setLastEvent({ type: "timer:expired", payload });
      setTimerState((prev) => prev ? { ...prev, remaining: 0, expired: true } : null);
    });

    // ── Auction lifecycle events ──────────────────────────────────
    socket.on("auction:state", (payload: unknown) => {
      setLastEvent({ type: "auction:state", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
      }
    });

    socket.on("bid:placed", (payload: unknown) => {
      setLastEvent({ type: "bid:placed", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetAuctionBidsQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
      }
    });

    socket.on("player:selected", (payload: unknown) => {
      setLastEvent({ type: "player:selected", payload });
      setTimerState(null); // reset until server sends first tick
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetAuctionBidsQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
      }
    });

    socket.on("player:sold", (payload: unknown) => {
      setLastEvent({ type: "player:sold", payload });
      setTimerState(null);
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
      }
    });

    socket.on("player:unsold", (payload: unknown) => {
      setLastEvent({ type: "player:unsold", payload });
      setTimerState(null);
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
      }
    });

    socket.on("auction:started", (payload: unknown) => {
      setLastEvent({ type: "auction:started", payload });
      if (auctionId) queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
    });

    socket.on("auction:paused", (payload: unknown) => {
      setLastEvent({ type: "auction:paused", payload });
      if (auctionId) queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
    });

    socket.on("auction:resumed", (payload: unknown) => {
      setLastEvent({ type: "auction:resumed", payload });
      if (auctionId) queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
    });

    return () => {
      socket.disconnect();
    };
  }, [auctionId, queryClient, joinAuction]);

  return { socket: socketRef.current, connected, lastEvent, timerState };
}
