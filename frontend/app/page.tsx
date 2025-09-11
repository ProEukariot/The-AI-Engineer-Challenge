"use client";

import { useEffect, useMemo, useState } from "react";

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const envUrl = (window as any).NEXT_PUBLIC_API_URL as string | undefined;
    if (envUrl) return envUrl;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export default function HomePage() {
  const apiBase = useMemo(() => getApiBaseUrl(), []);
  const [health, setHealth] = useState<string>("checking...");
  const [developerMessage, setDeveloperMessage] = useState<string>(
    "You are a helpful assistant."
  );
  const [userMessage, setUserMessage] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [responseText, setResponseText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetch(`${apiBase}/api/health`)
      .then((r) => r.json())
      .then((d) => setHealth(d.status || JSON.stringify(d)))
      .catch(() => setHealth("error"));
  }, [apiBase]);

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResponseText("");
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          api_key: apiKey,
          model: "gpt-4.1",
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResponseText((prev) => prev + decoder.decode(value));
      }
    } catch (err: any) {
      setResponseText(`Error: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 720,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>AI Engineer Challenge</h1>
      <p>
        Backend health: <strong>{health}</strong>
      </p>

      <form onSubmit={handleChatSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>OpenAI API Key</span>
          <input
            type="password"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>System Prompt</span>
          <textarea
            value={developerMessage}
            onChange={(e) => setDeveloperMessage(e.target.value)}
            rows={3}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>User Message</span>
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            rows={3}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 14px",
            background: "#111827",
            color: "white",
            border: 0,
            borderRadius: 6,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Response</h2>
        <div
          style={{
            minHeight: 120,
            whiteSpace: "pre-wrap",
            border: "1px solid #e5e7eb",
            padding: 12,
            borderRadius: 6,
            background: "#fafafa",
          }}
        >
          {responseText || "No response yet."}
        </div>
      </section>

      <footer style={{ fontSize: 12, color: "#6b7280" }}>
        API base: {apiBase}
      </footer>
    </main>
  );
}


