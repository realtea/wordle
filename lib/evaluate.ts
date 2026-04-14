export type LetterStatus = "correct" | "present" | "absent";

export function evaluateGuess(guess: string, target: string): LetterStatus[] {
  const result: LetterStatus[] = Array(5).fill("absent");
  const targetArr = target.split("");
  const guessArr = guess.split("");
  const used = Array(5).fill(false);

  // First pass: correct letters
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  // Second pass: present letters
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessArr[i] === targetArr[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return result;
}
