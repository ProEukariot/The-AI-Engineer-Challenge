"use client";

import { useState, useEffect } from "react";

interface PDF {
  pdf_id: string;
  filename: string;
  chunks_count: number;
  upload_time: string;
}

export default function Home() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gpt-4.1");
  const [developerMessage, setDeveloperMessage] = useState<string>(
    "You are a helpful assistant."
  );
  const [userMessage, setUserMessage] = useState<string>("");
  const [health, setHealth] = useState<string>("unknown");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHealthLoading, setIsHealthLoading] = useState<boolean>(false);
  const [responseText, setResponseText] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  // PDF and RAG related state
  const [activeTab, setActiveTab] = useState<"chat" | "rag">("chat");
  const [uploadedPDFs, setUploadedPDFs] = useState<PDF[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<string>("");
  const [ragMessage, setRagMessage] = useState<string>("");
  const [ragResponse, setRagResponse] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isRagLoading, setIsRagLoading] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  async function checkHealth() {
    setError("");
    setIsHealthLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/health`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      const data = await res.json();
      setHealth(data?.status || "unknown");
    } catch (e: any) {
      setHealth("error");
      setError(e?.message || "Health check error");
    } finally {
      setIsHealthLoading(false);
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

  // Load uploaded PDFs on component mount
  useEffect(() => {
    loadPDFs();
  }, []);

  async function loadPDFs() {
    try {
      const res = await fetch(`${apiBaseUrl}/api/pdfs`);
      if (res.ok) {
        const data = await res.json();
        setUploadedPDFs(data.pdfs || []);
      }
    } catch (e) {
      console.error("Failed to load PDFs:", e);
    }
  }

  async function uploadPDF() {
    if (!uploadFile || !apiKey) {
      setError("Please select a PDF file and provide an API key");
      return;
    }

    setError("");
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("api_key", apiKey);

      const res = await fetch(`${apiBaseUrl}/api/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Upload failed: ${res.status}`);
      }

      const data = await res.json();
      setUploadedPDFs(prev => [...prev, data]);
      setSelectedPDF(data.pdf_id);
      setUploadFile(null);
      
      // Switch to RAG tab after successful upload
      setActiveTab("rag");
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function sendRAGMessage() {
    if (!selectedPDF || !ragMessage || !apiKey) {
      setError("Please select a PDF, enter a message, and provide an API key");
      return;
    }

    setError("");
    setRagResponse("");
    setIsRagLoading(true);
    
    try {
      const res = await fetch(`${apiBaseUrl}/api/rag-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: ragMessage,
          model,
          api_key: apiKey,
          pdf_id: selectedPDF,
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
        setRagResponse((prev) => prev + chunk);
      }
    } catch (e: any) {
      setError(e?.message || "RAG request failed");
    } finally {
      setIsRagLoading(false);
    }
  }

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10 flex flex-col gap-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold">AI Chat & PDF RAG System</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "chat"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("chat")}
        >
          General Chat
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "rag"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("rag")}
        >
          PDF RAG Chat
        </button>
      </div>

      {/* Two-column grid: inputs (left), output (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Inputs */}
        <div className="flex flex-col gap-4">
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
            <select
              className="border rounded px-3 h-10 bg-white text-black"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="gpt-4.1">gpt-4.1</option>
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
            </select>
          </div>

          {activeTab === "chat" ? (
            <>
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
                  className="border rounded px-4 h-10 bg-black text-white disabled:opacity-50 flex items-center gap-2"
                  onClick={sendMessage}
                  disabled={isLoading || !apiKey || !userMessage}
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Streaming…</span>
                    </>
                  ) : (
                    <span>Send</span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* PDF Upload Section */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Upload PDF</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="border rounded px-3 py-2 bg-white text-black"
                  />
                  <button
                    className="border rounded px-4 h-10 bg-blue-600 text-white disabled:opacity-50 flex items-center gap-2"
                    onClick={uploadPDF}
                    disabled={isUploading || !uploadFile || !apiKey}
                  >
                    {isUploading ? (
                      <>
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Uploading…</span>
                      </>
                    ) : (
                      <span>Upload PDF</span>
                    )}
                  </button>
                </div>
              </div>

              {/* PDF Selection */}
              {uploadedPDFs.length > 0 && (
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium">Select PDF to Chat With</label>
                  <select
                    className="border rounded px-3 h-10 bg-white text-black"
                    value={selectedPDF}
                    onChange={(e) => setSelectedPDF(e.target.value)}
                  >
                    <option value="">Select a PDF...</option>
                    {uploadedPDFs.map((pdf) => (
                      <option key={pdf.pdf_id} value={pdf.pdf_id}>
                        {pdf.filename} ({pdf.chunks_count} chunks)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* RAG Chat Input */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Ask about the PDF</label>
                <textarea
                  className="border rounded p-3 min-h-24 bg-white text-black"
                  value={ragMessage}
                  onChange={(e) => setRagMessage(e.target.value)}
                  placeholder="Ask questions about the uploaded PDF..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="border rounded px-4 h-10 bg-green-600 text-white disabled:opacity-50 flex items-center gap-2"
                  onClick={sendRAGMessage}
                  disabled={isRagLoading || !selectedPDF || !ragMessage || !apiKey}
                >
                  {isRagLoading ? (
                    <>
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Streaming…</span>
                    </>
                  ) : (
                    <span>Ask PDF</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Output */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">
            {activeTab === "chat" ? "Response" : "PDF RAG Response"}
          </label>
          <pre className="border rounded p-3 whitespace-pre-wrap min-h-[400px] bg-white text-black">
            {activeTab === "chat" ? responseText : ragResponse}
          </pre>
          {error ? (
            <div className="text-red-600 text-sm border border-red-300 bg-red-50 rounded p-3">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      {/* Floating health button */}
      <button
        aria-label="Check API health"
        title={`Health: ${health}`}
        className="fixed bottom-4 right-4 border rounded-full px-4 h-12 bg-black text-white shadow-lg disabled:opacity-50 flex items-center gap-2"
        onClick={checkHealth}
        disabled={isHealthLoading}
      >
        {isHealthLoading ? (
          <>
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span>Checking…</span>
          </>
        ) : (
          <span>Health: {health}</span>
        )}
      </button>
    </div>
  );
}
