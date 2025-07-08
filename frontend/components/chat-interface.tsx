"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Send, Bot, User, Settings, Key } from "lucide-react";
import { ThemeToggle } from "./ui/theme-toggle";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [developerMessage, setDeveloperMessage] = useState("You are a helpful AI assistant.");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4.1");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || !apiKey.trim()) return;

    const newMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, newMessage]);
    setUserMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          model: model,
          api_key: apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let assistantMessage = "";
      const assistantMessageObj: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev: Message[]) => [...prev, assistantMessageObj]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantMessage += chunk;
        
        setMessages((prev: Message[]) => 
          prev.map((msg: Message, index: number) => 
            index === prev.length - 1 
              ? { ...msg, content: assistantMessage }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
        timestamp: new Date(),
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Settings Sidebar */}
      <div className={`w-80 bg-card border-r border-border transition-all duration-300 ${showSettings ? "translate-x-0" : "-translate-x-full"} fixed left-0 top-0 h-full z-50 lg:relative lg:translate-x-0`}>
        <Card className="h-full rounded-none border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>
              Configure your chat settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenAI API Key</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <select
                value={model}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setModel(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                <option value="gpt-4o">GPT-4o Turbo</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">System Message</label>
              <Textarea
                placeholder="You are a helpful AI assistant..."
                value={developerMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDeveloperMessage(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">OpenAI Chat</h1>
              <p className="text-sm text-muted-foreground">
                Powered by OpenAI API
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="lg:hidden"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 p-4 space-y-4 ${messages.length > 0 ? 'overflow-y-auto' : ''}`}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Welcome to OpenAI Chat</h3>
                  <p className="text-muted-foreground">
                    Start a conversation by typing a message below
                  </p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message: Message, index: number) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={userMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading || !apiKey.trim()}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !userMessage.trim() || !apiKey.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {!apiKey.trim() && (
            <p className="text-sm text-muted-foreground mt-2">
              Please enter your OpenAI API key in settings to start chatting
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 