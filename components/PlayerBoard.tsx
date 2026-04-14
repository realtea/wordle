"use client";

import Tile from "./Tile";
import { LetterStatus } from "@/lib/evaluate";

interface GuessEntry {
  word: string;
  result: LetterStatus[];
}

interface PlayerBoardProps {
  label: string;
  guesses: GuessEntry[];
  currentGuess: string;
  currentRow: number;
  maxGuesses: number;
  isLocal: boolean;
  solved: boolean;
  shakingRow: number | null;
  revealLetters: boolean;  // false = hide letters on opponent board during game
}

export default function PlayerBoard({
  label,
  guesses,
  currentGuess,
  currentRow,
  maxGuesses,
  isLocal,
  solved,
  shakingRow,
  revealLetters,
}: PlayerBoardProps) {
  const rows = [];

  for (let r = 0; r < maxGuesses; r++) {
    const tiles = [];

    for (let c = 0; c < 5; c++) {
      let letter = "";
      let status: LetterStatus | undefined;
      let revealed = false;

      if (r < guesses.length) {
        // Show the actual letter only if this is the local player OR letters are revealed (game over)
        const showLetter = isLocal || revealLetters;
        letter = showLetter ? guesses[r].word[c].toUpperCase() : "";
        status = guesses[r].result[c];
        revealed = true;
      } else if (isLocal && r === currentRow) {
        letter = (currentGuess[c] || "").toUpperCase();
      }

      tiles.push(
        <Tile key={c} letter={letter} status={status} revealed={revealed} delay={c * 250} />
      );
    }

    let rowClass = "flex gap-[3px]";
    if (shakingRow === r) rowClass += " animate-shake";

    rows.push(
      <div key={r} className={rowClass}>{tiles}</div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className={`text-xs uppercase tracking-wider mb-2 font-bold
        ${solved ? "text-green-400" : "text-neutral-400"}`}>
        {label}
        {solved && " - Solved!"}
      </p>
      <div className="flex flex-col gap-[3px]">{rows}</div>
      <p className="text-[10px] text-neutral-500 mt-1">
        {guesses.length} / {maxGuesses} guesses
      </p>
    </div>
  );
}
