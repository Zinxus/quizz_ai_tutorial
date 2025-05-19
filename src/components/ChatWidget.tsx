"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Minus } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [history, open]);

  const sendMessage = async (text: string) => {
    setHistory((h) => [...h, { role: "user", content: text }]);
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history }),
    }).then((r) => r.json());
    setHistory((h) => [...h, { role: "assistant", content: res.message.content }]);
    setLoading(false);
  };

  return (
    <>
      {/* Panel if open */}
      {open && (
        <div className="fixed bottom-0 right-0 w-96 h-[480px] bg-white shadow-xl rounded-tl-lg flex flex-col overflow-hidden z-50">
          {/* Header and button Minus */}
          <div className="flex items-center justify-between bg-blue-600 text-white px-3 py-2">
            <div className="text-sm font-semibold">Chat with Tutor</div>
            <button
              className="p-1"
              onClick={() => setOpen(false)}
              aria-label="Minimize chat"
            >
              <Minus size={20} />
            </button>
          </div>

          {/* Mesage */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-100"
          >
            {history.map((m, i) => (
              <ChatMessage key={i} message={m} />
            ))}
            {loading && <div className="italic text-sm text-gray-500">...typing</div>}
          </div>

          {/* Input */}
          <ChatInput onSend={sendMessage} />
        </div>
      )}

      {/* Button open if close */}
      {!open && (
        <button
          className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg z-50"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </>
  );
}
