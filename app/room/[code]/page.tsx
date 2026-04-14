"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import MultiplayerGame from "@/components/MultiplayerGame";

function RoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const code = (params.code as string).toUpperCase();
  const name = searchParams.get("name") || "Player";
  const isJoining = searchParams.get("join") === "1";

  return (
    <MultiplayerGame
      roomCode={code}
      playerName={name}
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
