"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  playerIndex: number;
  playerName: string;
  text: string;
}

interface ChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  localPlayerIndex: number;
}

export default function Chat({ messages, onSend, localPlayerIndex }: ChatProps) {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const unreadCount = isOpen ? 0 : messages.length;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen ? (
        <div className="w-72 sm:w-80 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl flex flex-col"
          style={{ height: "320px" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Chat</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white text-lg leading-none cursor-pointer"
            >
              x
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.length === 0 && (
              <p className="text-neutral-500 text-xs text-center mt-4">No messages yet</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.playerIndex === localPlayerIndex ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-neutral-500 mb-0.5">{msg.playerName}</span>
                <div className={`px-3 py-1.5 rounded-lg text-sm max-w-[80%] break-words
                  ${msg.playerIndex === localPlayerIndex
                    ? "bg-green-700 text-white"
                    : "bg-neutral-700 text-white"
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-neutral-700 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              maxLength={200}
              className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-3 py-1.5 text-sm
                text-white placeholder-neutral-500 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handleSend}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white
            w-12 h-12 rounded-full flex items-center justify-center text-lg cursor-pointer shadow-lg relative"
        >
          💬
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold
              w-5 h-5 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
