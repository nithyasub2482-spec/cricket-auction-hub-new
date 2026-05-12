import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "http";

let io: IOServer | null = null;

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
