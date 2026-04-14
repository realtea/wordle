"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function HomeScreen() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    const code = generateRoomCode();
    router.push(`/room/${code}?name=${encodeURIComponent(playerName || "Player 1")}`);
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Room code must be 6 characters");
      return;
    }
    router.push(`/room/${code}?name=${encodeURIComponent(playerName || "Player 2")}&join=1`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl sm:text-5xl font-bold text-center tracking-[0.2em] uppercase mb-2">
          Wordle
        </h1>
        <p className="text-neutral-400 text-center text-sm mb-10">
          Real-Time Multiplayer
        </p>

        {/* Name input */}
        <div className="mb-8">
          <label className="block text-neutral-400 text-xs uppercase tracking-wider mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full bg-neutral-800 border border-neutral-600 rounded px-4 py-3 text-white text-sm
              placeholder-neutral-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* Create Room */}
        <button
          onClick={handleCreate}
          className="w-full bg-green-600 hover:bg-green-500 text-white
            font-bold py-4 rounded text-lg uppercase tracking-wider transition-colors cursor-pointer mb-4"
        >
          Create Room
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-neutral-700" />
          <span className="text-neutral-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-neutral-700" />
        </div>

        {/* Join Room */}
        <label className="block text-neutral-400 text-xs uppercase tracking-wider mb-2">
          Room Code
        </label>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase().slice(0, 6));
              setError("");
            }}
            placeholder="ABC123"
            maxLength={6}
            className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-4 py-3 text-white
              text-lg tracking-[0.3em] text-center uppercase placeholder-neutral-500
              focus:outline-none focus:border-yellow-500 transition-colors font-mono"
          />
          <button
            onClick={handleJoin}
            disabled={joinCode.length !== 6}
            className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-neutral-700 text-white
              font-bold px-6 py-3 rounded text-sm uppercase tracking-wider transition-colors cursor-pointer"
          >
            Join
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-center text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
