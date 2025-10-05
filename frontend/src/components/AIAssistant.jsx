import React, { useEffect, useRef, useState } from "react";
import { api } from "../api";
import toast from "react-hot-toast";
import { ArrowLeft, Brain, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AIAssistant = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); // {id, role, text, created_at}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const token = localStorage.getItem("token");

  const scrollToBottom = () =>
    endRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(
        "/api/ai/chat/history",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data || []);
    } catch {
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setLoading(true);

    const optimisticUser = {
      id: `local-${Date.now()}`,
      role: "user",
      text: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");

    try {
      const res = await api.post(
        "/api/ai/chat",
        { message: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const assistant = res.data?.assistant;
      if (assistant) {
        setMessages((prev) => [...prev, assistant]);
      } else {
        toast.error("No response from assistant");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                AI Assistant
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-140px)]">
          <div className="card p-0 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="text-center text-gray-500 py-10">
                  Start the conversation by asking a question.
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-md transition-all duration-200 ${
                      m.role === "user"
                        ? "bg-primary-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-2xl text-sm animate-pulse">
                    Typing...
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input Box */}
            <div className="border-t p-3 bg-white">
              <div className="flex items-end space-x-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                  rows={1}
                  style={{ maxHeight: "120px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="btn-primary h-[44px] px-4 flex items-center space-x-2 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant;
