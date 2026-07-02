"use client";

import { io, Socket } from "socket.io-client";
import { api } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io({ auth: { token: api.token } });
  }
  return socket;
}
