import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "http";

let io: IOServer | null = null;

interface TimerState {
  remaining: number;
  totalSeconds: number;
  interval: ReturnType<typeof setInterval> | null;
}

const timers = new Map<number, TimerState>();

export function initSocketServer(httpServer: HttpServer): IOServer {
  io = new IOServer(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join:auction", (auctionId: number) => {
      socket.join(`auction:${auctionId}`);
      // Immediately send current timer state to newly connected client
      const state = timers.get(auctionId);
      if (state) {
        socket.emit("timer:update", {
          remaining: state.remaining,
          total: state.totalSeconds,
          expired: state.remaining <= 0,
        });
      }
    });

    socket.on("leave:auction", (auctionId: number) => {
      socket.leave(`auction:${auctionId}`);
    });

    socket.on("disconnect", () => {
      // cleanup handled automatically by socket.io
    });
  });

  return io;
}

export function getIO(): IOServer | null {
  return io;
}

export function emitToAuction(auctionId: number, event: string, data: unknown): void {
  if (io) {
    io.to(`auction:${auctionId}`).emit(event, data);
    io.emit(event, data); // also broadcast globally for dashboards
  }
}

// ─── Timer management ───────────────────────────────────────────────────────

function runTick(auctionId: number): void {
  const state = timers.get(auctionId);
  if (!state) return;

  state.remaining -= 1;

  if (state.remaining <= 0) {
    state.remaining = 0;
    if (state.interval) {
      clearInterval(state.interval);
      state.interval = null;
    }
    emitToAuction(auctionId, "timer:update", {
      remaining: 0,
      total: state.totalSeconds,
      expired: true,
    });
    emitToAuction(auctionId, "timer:expired", { auctionId });
  } else {
    emitToAuction(auctionId, "timer:update", {
      remaining: state.remaining,
      total: state.totalSeconds,
      expired: false,
    });
  }
}

/**
 * Start (or restart) a fresh countdown for the given auction.
 * Called when a player is selected.
 */
export function startTimer(auctionId: number, seconds: number): void {
  stopTimer(auctionId);

  const state: TimerState = {
    remaining: seconds,
    totalSeconds: seconds,
    interval: null,
  };
  timers.set(auctionId, state);

  // Emit the initial value immediately so clients show the full count
  emitToAuction(auctionId, "timer:update", {
    remaining: seconds,
    total: seconds,
    expired: false,
  });

  state.interval = setInterval(() => runTick(auctionId), 1000);
}

/**
 * Reset the timer to its full duration (called when a new bid is placed).
 */
export function resetTimer(auctionId: number): void {
  const state = timers.get(auctionId);
  if (!state) return;
  startTimer(auctionId, state.totalSeconds);
}

/**
 * Pause the timer and return the remaining seconds.
 * The state is kept so resumeTimer() can pick up where it left off.
 */
export function pauseTimer(auctionId: number): number | null {
  const state = timers.get(auctionId);
  if (!state) return null;
  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
  }
  emitToAuction(auctionId, "timer:update", {
    remaining: state.remaining,
    total: state.totalSeconds,
    expired: false,
    paused: true,
  });
  return state.remaining;
}

/**
 * Resume a paused timer from its saved remaining value.
 */
export function resumeTimer(auctionId: number): void {
  const state = timers.get(auctionId);
  if (!state || state.interval || state.remaining <= 0) return;

  emitToAuction(auctionId, "timer:update", {
    remaining: state.remaining,
    total: state.totalSeconds,
    expired: false,
  });

  state.interval = setInterval(() => runTick(auctionId), 1000);
}

/**
 * Stop and discard the timer entirely (called on sold / unsold).
 */
export function stopTimer(auctionId: number): void {
  const state = timers.get(auctionId);
  if (state?.interval) {
    clearInterval(state.interval);
  }
  timers.delete(auctionId);
}
