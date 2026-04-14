"use client";

import { LetterStatus } from "@/lib/evaluate";

interface KeyboardProps {
  letterStatuses: Record<string, LetterStatus>;
  onKey: (key: string) => void;
}

const rows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

const statusColors: Record<string, string> = {
  correct: "bg-green-600",
  present: "bg-yellow-500",
  absent: "bg-neutral-700",
};

export default function Keyboard({ letterStatuses, onKey }: KeyboardProps) {
  return (
    <div className="w-full max-w-[500px] select-none">
      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-[5px] mb-[5px]">
          {ri === 1 && <div className="flex-[0.5]" />}
          {row.map((key) => {
            const isWide = key === "ENTER" || key === "BACK";
            const status = letterStatuses[key];
            const bg = status ? statusColors[status] : "bg-neutral-500";

            return (
              <button
                key={key}
                onClick={() => onKey(key === "BACK" ? "Backspace" : key === "ENTER" ? "Enter" : key)}
                className={`${bg} text-white font-bold rounded flex items-center justify-center
                  ${isWide ? "px-2 min-w-[52px] text-[11px]" : "w-[32px] text-xs"}
                  h-[44px] cursor-pointer transition-colors active:opacity-80`}
              >
                {key === "BACK" ? "⌫" : key}
              </button>
            );
          })}
          {ri === 1 && <div className="flex-[0.5]" />}
        </div>
      ))}
    </div>
  );
}
