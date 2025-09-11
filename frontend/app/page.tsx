"use client";

import { useState } from "react";

export default function Home() {
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
  );
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gpt-4.1");
  const [developerMessage, setDeveloperMessage] = useState<string>(
    "You are a helpful assistant."
  );
  const [userMessage, setUserMessage] = useState<string>("");
  const [health, setHealth] = useState<string>("unknown");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseText, setResponseText] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function checkHealth() {
    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/api/health`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      const data = await res.json();
      setHealth(data?.status || "unknown");
    } catch (e: any) {
      setHealth("error");
      setError(e?.message || "Health check error");
    }
  }

  async function sendMessage() {
    setError("");
    setResponseText("");
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          model,
          api_key: apiKey,
        }),
      });

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setResponseText((prev) => prev + chunk);
      }
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10 flex flex-col gap-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Simple Chat UI</h1>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">API Base URL</label>
        <input
          className="border rounded px-3 h-10 bg-white text-black"
          value={apiBaseUrl}
          onChange={(e) => setApiBaseUrl(e.target.value)}
          placeholder="http://localhost:8000"
        />
        <button
          className="border rounded px-3 h-10 w-max bg-black text-white disabled:opacity-50"
          onClick={checkHealth}
          disabled={isLoading}
        >
          Check Health ({health})
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">OpenAI API Key</label>
        <input
          className="border rounded px-3 h-10 bg-white text-black"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Model</label>
        <input
          className="border rounded px-3 h-10 bg-white text-black"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">System Prompt</label>
        <textarea
          className="border rounded p-3 min-h-24 bg-white text-black"
          value={developerMessage}
          onChange={(e) => setDeveloperMessage(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">User Message</label>
        <textarea
          className="border rounded p-3 min-h-24 bg-white text-black"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          className="border rounded px-4 h-10 bg-black text-white disabled:opacity-50"
          onClick={sendMessage}
          disabled={isLoading || !apiKey || !userMessage}
        >
          {isLoading ? "Streaming..." : "Send"}
        </button>
        {error ? <span className="text-red-600 text-sm">{error}</span> : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Response</label>
        <pre className="border rounded p-3 whitespace-pre-wrap min-h-24 bg-white text-black">
          {responseText || ""}
        </pre>
      </div>
    </div>
  );
}
