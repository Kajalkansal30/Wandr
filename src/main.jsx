import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

async function bootstrap() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    try {
      const Sentry = await import("@sentry/react");
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
      });
    } catch (err) {
      console.warn("Sentry init skipped:", err?.message || err);
    }
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
