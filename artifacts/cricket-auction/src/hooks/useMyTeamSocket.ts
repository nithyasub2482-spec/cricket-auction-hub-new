import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetTeamQueryKey,
  getGetTeamSquadQueryKey,
  getListPlayersQueryKey,
} from "@workspace/api-client-react";
import { toast } from "sonner";

export interface LiveActivity {
  auctionId: number;
  slotId: number;
  playerName: string;
  playerCategory: string;
  basePrice: number;
  currentBid: number;
  bidCount: number;
  leadingTeamId: number | null;
  leadingTeamName: string | null;
  leadingTeamColor: string | null;
  isMyTeamLeading: boolean;
}

interface PlayerSelectedPayload {
  slot: {
    id: number;
    auctionId: number;
    basePrice: number;
    currentBid: number;
    bidCount: number;
    highestBidTeamId: number | null;
    player?: { id: number; name: string; category: string } | null;
  };
  player?: { name: string; category: string } | null;
}

interface BidPlacedPayload {
  bid: {
    teamId: number;
    amount: number;
    team?: { id: number; name: string; shortName: string; primaryColor: string } | null;
  };
  slot: {
    id: number;
    auctionId: number;
    basePrice: number;
    currentBid: number;
    bidCount: number;
    highestBidTeamId: number | null;
    player?: { id: number; name: string; category: string } | null;
  };
}

interface PlayerSoldPayload {
  slot: {
    auctionId: number;
    currentBid: number;
    soldToTeamId?: number | null;
    soldPrice?: number | null;
    player?: { id: number; name: string; category: string } | null;
  };
  player?: { name: string } | null;
  team?: { id: number; name: string; shortName: string; primaryColor: string } | null;
  amount: number;
}

interface PlayerUnsoldPayload {
  slot: { auctionId: number };
  player?: { name: string } | null;
}

export function useMyTeamSocket(teamId: number | null | undefined) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [liveActivity, setLiveActivity] = useState<LiveActivity | null>(null);

  // Stable invalidate helper
  const invalidateTeam = useCallback(() => {
    if (!teamId) return;
    queryClient.invalidateQueries({ queryKey: getGetTeamQueryKey(teamId) });
    queryClient.invalidateQueries({ queryKey: getGetTeamSquadQueryKey(teamId) });
    queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey({ status: "available" }) });
  }, [teamId, queryClient]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || "/api", {
      transports: ["websocket", "polling"],
      reconnection: true,
      path: "/api/socket.io",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // Fetch initial state in case we joined mid-auction
      fetch(`${import.meta.env.VITE_API_URL || ""}/api/auctions`)
        .then(r => r.json())
        .then(async (auctions) => {
          const activeAuction = auctions.find((a: any) => a.status === "active" && a.currentSlotId);
          if (activeAuction) {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auctions/${activeAuction.id}/current-slot`);
            if (res.ok) {
              const slot = await res.json();
              if (slot && slot.status === "active") {
                setLiveActivity({
                  auctionId: slot.auctionId,
                  slotId: slot.id,
                  playerName: slot.player?.name ?? "Unknown Player",
                  playerCategory: slot.player?.category ?? "—",
                  basePrice: slot.basePrice,
                  currentBid: slot.currentBid ?? slot.basePrice,
                  bidCount: slot.bidCount ?? 0,
                  leadingTeamId: slot.highestBidTeamId,
                  leadingTeamName: slot.highestBidTeam?.name ?? slot.highestBidTeam?.shortName ?? null,
                  leadingTeamColor: slot.highestBidTeam?.primaryColor ?? null,
                  isMyTeamLeading: !!teamId && slot.highestBidTeamId === teamId,
                });
              }
            }
          }
        })
        .catch(console.error);
    });
    socket.on("disconnect", () => setConnected(false));

    // ── Player selected: a new lot opens ──────────────────────────────────────
    socket.on("player:selected", (payload: PlayerSelectedPayload) => {
      const slot = payload.slot;
      const playerName = payload.player?.name ?? slot.player?.name ?? "Unknown Player";
      const playerCat = payload.player?.category ?? slot.player?.category ?? "—";
      setLiveActivity({
        auctionId: slot.auctionId,
        slotId: slot.id,
        playerName,
        playerCategory: playerCat,
        basePrice: slot.basePrice,
        currentBid: slot.basePrice,
        bidCount: 0,
        leadingTeamId: null,
        leadingTeamName: null,
        leadingTeamColor: null,
        isMyTeamLeading: false,
      });
    });

    // ── Bid placed: update current high bid ────────────────────────────────────
    socket.on("bid:placed", (payload: BidPlacedPayload) => {
      const { bid, slot } = payload;
      const isMyTeam = !!teamId && bid.teamId === teamId;
      setLiveActivity((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentBid: bid.amount,
          bidCount: slot.bidCount,
          leadingTeamId: bid.teamId,
          leadingTeamName: bid.team?.name ?? bid.team?.shortName ?? null,
          leadingTeamColor: bid.team?.primaryColor ?? null,
          isMyTeamLeading: isMyTeam,
        };
      });
    });

    // ── Player sold ────────────────────────────────────────────────────────────
    socket.on("player:sold", (payload: PlayerSoldPayload) => {
      const wonByMyTeam = !!teamId && payload.team?.id === teamId;
      const playerName = payload.player?.name ?? "Player";
      const amount = payload.amount;

      setLiveActivity(null);

      if (wonByMyTeam) {
        toast.success(`You won ${playerName}!`, {
          description: `Signed for ₹${(amount / 1e5).toFixed(0)}L — squad updated`,
          duration: 5000,
        });
        invalidateTeam();
      } else {
        // Another team won — available players list has shrunk
        queryClient.invalidateQueries({
          queryKey: getListPlayersQueryKey({ status: "available" }),
        });
      }
    });

    // ── Player unsold ─────────────────────────────────────────────────────────
    socket.on("player:unsold", (_payload: PlayerUnsoldPayload) => {
      setLiveActivity(null);
      queryClient.invalidateQueries({
        queryKey: getListPlayersQueryKey({ status: "available" }),
      });
    });

    // ── Auction ended ─────────────────────────────────────────────────────────
    socket.on("auction:state", () => {
      setLiveActivity(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [teamId, invalidateTeam, queryClient]);

  return { connected, liveActivity };
}
