import { configureEcho } from "@laravel/echo-react";
import Pusher from "pusher-js";

if (typeof window !== "undefined") {
  configureEcho({
    broadcaster: "reverb",
    Pusher,
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
  });
}
