"use client";

import { useState } from "react";

export default function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="p-2 border-t flex gap-2">
      <input
        className="flex-1 border text-black rounded px-2 py-1"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim() !== "") {
            onSend(text);
            setText("");
          }
        }}
      />
      <button
        className="bg-blue-600 text-white px-3 rounded"
        onClick={() => {
          onSend(text);
          setText("");
        }}
      >
        Send
      </button>
    </div>
  );
}
