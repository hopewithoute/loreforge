import { useEffect, useState } from "react";

type HealthState = "checking" | "online" | "offline";

interface HealthResponse {
  status: "ok";
}

export function App() {
  const [healthState, setHealthState] = useState<HealthState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    async function checkHealth() {
      try {
        const response = await fetch("/api/health", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Health check failed with ${response.status}`);
        }

        const payload = (await response.json()) as HealthResponse;
        setHealthState(payload.status === "ok" ? "online" : "offline");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setHealthState("offline");
      }
    }

    void checkHealth();
    return () => controller.abort();
  }, []);

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Game concept world builder</p>
          <h1>LoreForge</h1>
        </div>
        <p className={`health health--${healthState}`} role="status">
          <span aria-hidden="true" />
          {healthState === "checking" && "Checking forge"}
          {healthState === "online" && "Forge online"}
          {healthState === "offline" && "Forge unavailable"}
        </p>
      </header>

      <section className="intro" aria-labelledby="foundation-heading">
        <p className="section-number">Foundation / 01</p>
        <h2 id="foundation-heading">Shape worlds before writing production code.</h2>
        <p>
          The runtime foundation is ready. Generation controls, asynchronous status, and
          the persistent gallery arrive in the next vertical slices.
        </p>
      </section>
    </main>
  );
}
