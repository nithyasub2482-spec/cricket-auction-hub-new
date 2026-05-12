import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentSlotQueryKey, getGetAuctionBidsQueryKey, getGetAuctionQueryKey } from "@workspace/api-client-react";

export function useAuctionSocket(auctionId?: number) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io("/api", {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("auction:state", (payload) => {
      setLastEvent({ type: "auction:state", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
      }
    });

    socket.on("bid:placed", (payload) => {
      setLastEvent({ type: "bid:placed", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetAuctionBidsQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
      }
    });

    socket.on("player:selected", (payload) => {
      setLastEvent({ type: "player:selected", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetAuctionBidsQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
      }
    });

    socket.on("player:sold", (payload) => {
      setLastEvent({ type: "player:sold", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
      }
    });

    socket.on("player:unsold", (payload) => {
      setLastEvent({ type: "player:unsold", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSlotQueryKey(auctionId) });
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
      }
    });

    socket.on("auction:started", (payload) => {
      setLastEvent({ type: "auction:started", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
      }
    });

    socket.on("auction:paused", (payload) => {
      setLastEvent({ type: "auction:paused", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
      }
    });

    socket.on("auction:resumed", (payload) => {
      setLastEvent({ type: "auction:resumed", payload });
      if (auctionId) {
        queryClient.invalidateQueries({ queryKey: getGetAuctionQueryKey(auctionId) });
      }
    });

    socket.on("timer:update", (payload) => {
      setLastEvent({ type: "timer:update", payload });
    });

    return () => {
      socket.disconnect();
    };
  }, [auctionId, queryClient]);

  return { socket: socketRef.current, connected, lastEvent };
}