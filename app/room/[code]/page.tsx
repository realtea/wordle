"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import MultiplayerGame from "@/components/MultiplayerGame";

function RoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const code = (params.code as string).toUpperCase();
  const urlName = searchParams.get("name") || "";
  const isJoining = searchParams.get("join") === "1";

  // If joining and no name provided, show name input screen
  const [name, setName] = useState(urlName);
  const [confirmed, setConfirmed] = useState(!isJoining || !!urlName);

  if (!confirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold mb-2">Join Room</h2>
          <p className="text-neutral-400 text-sm mb-1">Room Code</p>
          <p className="text-3xl font-bold tracking-[0.3em] font-mono mb-8">{code}</p>

          <label className="block text-neutral-400 text-xs uppercase tracking-wider mb-2 text-left">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) setConfirmed(true);
            }}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
            className="w-full bg-neutral-800 border border-neutral-600 rounded px-4 py-3 text-white text-sm
              placeholder-neutral-500 focus:outline-none focus:border-green-500 transition-colors mb-4"
          />
          <button
            onClick={() => { if (name.trim()) setConfirmed(true); }}
            disabled={!name.trim()}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white
              font-bold py-3 rounded text-sm uppercase tracking-wider transition-colors cursor-pointer"
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <MultiplayerGame
      roomCode={code}
      playerName={name || "Player"}
      isJoining={isJoining}
    />
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-neutral-600 border-t-green-500 rounded-full animate-spin" />
      </div>
    }>
      <RoomContent />
    </Suspense>
  );
}
