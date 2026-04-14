"use client";

import { LetterStatus } from "@/lib/evaluate";

interface TileProps {
  letter: string;
  status?: LetterStatus;
  revealed: boolean;
  delay: number;
}

const statusColors: Record<LetterStatus, string> = {
  correct: "bg-green-600 border-green-600",
  present: "bg-yellow-500 border-yellow-500",
  absent: "bg-neutral-700 border-neutral-700",
};

export default function Tile({ letter, status, revealed, delay }: TileProps) {
  const base =
    "w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] border-2 flex items-center justify-center text-sm sm:text-lg font-bold uppercase select-none";

  const border = letter && !revealed ? "border-neutral-500" : "border-neutral-600";
  const bg = revealed && status ? statusColors[status] : "";
  const animation = revealed ? "animate-flip" : letter ? "animate-pop" : "";

  return (
    <div
      className={`${base} ${border} ${bg} ${animation} text-white`}
      style={{ animationDelay: revealed ? `${delay}ms` : "0ms" }}
    >
      {letter}
    </div>
  );
}
