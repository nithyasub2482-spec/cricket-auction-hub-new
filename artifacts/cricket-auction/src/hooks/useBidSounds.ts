import { useEffect, useRef } from "react";
import {
  playBidSound,
  playHammerSound,
  playUnsoldSound,
  playTimerExpiredSound,
  playTickSound,
} from "@/lib/sounds";
import type { TimerState } from "./useAuctionSocket";

/**
 * Plays audio cues that mirror auction events received from the socket.
 *
 * @param lastEvent - the latest socket event (from useAuctionSocket)
 * @param timerState - live timer state (from useAuctionSocket)
 */
export function useBidSounds(
  lastEvent: { type: string; payload: unknown } | null,
  timerState: TimerState | null,
) {
  const lastEventRef = useRef<typeof lastEvent>(null);
  const timerExpiredRef = useRef(false);
  const prevRemainingRef = useRef<number | null>(null);

  // React to discrete socket events
  useEffect(() => {
    if (!lastEvent) return;
    // Skip if we already processed this event object
    if (lastEvent === lastEventRef.current) return;
    lastEventRef.current = lastEvent;

    switch (lastEvent.type) {
      case "bid:placed":
        playBidSound();
        break;
      case "player:sold":
        playHammerSound();
        break;
      case "player:unsold":
        playUnsoldSound();
        break;
      case "timer:expired":
        playTimerExpiredSound();
        break;
    }
  }, [lastEvent]);

  // Soft tick for the last 5 seconds of the countdown
  useEffect(() => {
    if (!timerState) {
      prevRemainingRef.current = null;
      timerExpiredRef.current = false;
      return;
    }

    const { remaining, expired, paused } = timerState;

    if (expired) {
      timerExpiredRef.current = true;
      prevRemainingRef.current = remaining;
      return;
    }

    if (paused) {
      prevRemainingRef.current = remaining;
      return;
    }

    // Only tick if the counter actually decreased by 1 (avoid ticking on resets)
    const prev = prevRemainingRef.current;
    const ticked = prev !== null && remaining === prev - 1;
    prevRemainingRef.current = remaining;

    if (ticked && remaining > 0 && remaining <= 5) {
      playTickSound();
    }
  }, [timerState]);
}
