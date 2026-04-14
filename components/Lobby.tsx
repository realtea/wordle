"use client";

import { useState } from "react";

interface LobbyProps {
  roomCode: string;
}

export default function Lobby({ roomCode }: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Waiting for Opponent...</h2>
        <p className="text-neutral-400 text-sm mb-8">Share this room code with your friend</p>

        <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-6 mb-6 inline-block">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Room Code</p>
          <p className="text-4xl font-bold tracking-[0.4em] font-mono">{roomCode}</p>
        </div>

        <div className="block">
          <button
            onClick={copyCode}
            className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold px-6 py-3
              rounded text-sm uppercase tracking-wider transition-colors cursor-pointer"
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>

        {/* Spinner */}
        <div className="mt-10 flex justify-center">
          <div className="w-8 h-8 border-2 border-neutral-600 border-t-green-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
