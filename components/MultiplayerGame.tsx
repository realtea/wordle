"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import PlayerBoard from "./PlayerBoard";
import Keyboard from "./Keyboard";
import Lobby from "./Lobby";
import Chat from "./Chat";
import WinAnimation from "./WinAnimation";
import { LetterStatus } from "@/lib/evaluate";

const MAX_GUESSES = 8;
const WORD_LENGTH = 5;

interface GuessEntry {
  word: string;
  result: LetterStatus[];
}

interface ChatMessage {
  playerIndex: number;
  playerName: string;
  text: string;
}

interface PlayerInfo {
  name: string;
  index: number;
}

interface MultiplayerGameProps {
  roomCode: string;
  playerName: string;
  isJoining: boolean;
}

export default function MultiplayerGame({ roomCode, playerName, isJoining }: MultiplayerGameProps) {
  const socketRef = useRef<Socket | null>(null);

  // Connection state
  const [connected, setConnected] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Player info
  const [localIndex, setLocalIndex] = useState<number>(0);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);

  // Game state
  const [guesses, setGuesses] = useState<[GuessEntry[], GuessEntry[]]>([[], []]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [secretWords, setSecretWords] = useState<string[]>([]);
  const [gameOverReason, setGameOverReason] = useState("");
  const [localSolved, setLocalSolved] = useState(false);
  const [opponentSolved, setOpponentSolved] = useState(false);

  // UI state
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "error" | "success">("");
  const [shakingRow, setShakingRow] = useState<number | null>(null);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, LetterStatus>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [playAgainSent, setPlayAgainSent] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [won, setWon] = useState(false);
  const [revealingGuess, setRevealingGuess] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  // Connect socket on mount
  useEffect(() => {
    const socket = io({ autoConnect: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (isJoining) {
        socket.emit("join-room", { roomCode, playerName });
      } else {
        socket.emit("create-room", { playerName, roomCode });
      }
    });

    socket.on("room-created", () => {
      // We're in the lobby waiting
    });

    socket.on("game-start", ({ playerIndex, players: playerList }: { playerIndex: number; players: PlayerInfo[] }) => {
      setLocalIndex(playerIndex);
      setPlayers(playerList);
      setGameStarted(true);
      setGameOver(false);
      setWinner(null);
      setSecretWords([]);
      setGuesses([[], []]);
      setCurrentGuess("");
      setLetterStatuses({});
      setMessage("");
      setMessageType("");
      setLocalSolved(false);
      setOpponentSolved(false);
      setPlayAgainSent(false);
      setOpponentWantsRematch(false);
      setWon(false);
      setRevealingGuess(false);
      setDisconnected(false);
      setGameOverReason("");
    });

    socket.on("guess-result", ({ playerIndex, guess, result, guessIndex }: {
      playerIndex: number; guess: string; result: LetterStatus[]; guessIndex: number;
    }) => {
      setGuesses((prev) => {
        const updated: [GuessEntry[], GuessEntry[]] = [[...prev[0]], [...prev[1]]];
        updated[playerIndex] = [...updated[playerIndex]];
        updated[playerIndex][guessIndex] = { word: guess, result };
        return updated;
      });

      // If it's our guess, update keyboard
      // We determine "local" by comparing playerIndex to our stored localIndex
      // But localIndex might not be set yet in closure — use a ref pattern
    });

    socket.on("game-over", ({ winner: w, words, reason }: {
      winner: number | null; words: string[]; reason: string;
    }) => {
      setGameOver(true);
      setWinner(w);
      setSecretWords(words);
      setGameOverReason(reason);
    });

    socket.on("error-msg", ({ message: msg }: { message: string }) => {
      setErrorMsg(msg);
      setMessage(msg);
      setMessageType("error");
      setShakingRow(null); // reset in case
    });

    socket.on("chat-message", (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on("play-again-requested", () => {
      setOpponentWantsRematch(true);
    });

    socket.on("opponent-disconnected", ({ playerName: name }: { playerName: string }) => {
      setDisconnected(true);
      setMessage(`${name} disconnected`);
      setMessageType("error");
    });

    socket.on("connect_error", () => {
      setErrorMsg("Could not connect to server");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode, playerName, isJoining]);

  // Update keyboard statuses and solved state when guesses change
  useEffect(() => {
    if (localIndex === undefined) return;
    const myGuesses = guesses[localIndex];
    const newStatuses: Record<string, LetterStatus> = {};
    const priority: Record<LetterStatus, number> = { correct: 3, present: 2, absent: 1 };

    for (const entry of myGuesses) {
      for (let i = 0; i < 5; i++) {
        const letter = entry.word[i].toUpperCase();
        const current = newStatuses[letter];
        if (!current || priority[entry.result[i]] > priority[current]) {
          newStatuses[letter] = entry.result[i];
        }
      }
    }
    setLetterStatuses(newStatuses);

    // Check if local player solved
    if (myGuesses.length > 0) {
      const lastGuess = myGuesses[myGuesses.length - 1];
      if (lastGuess.result.every((r) => r === "correct")) {
        setLocalSolved(true);
      }
    }

    // Check opponent solved
    const opIndex = localIndex === 0 ? 1 : 0;
    const oppGuesses = guesses[opIndex];
    if (oppGuesses.length > 0) {
      const lastOpp = oppGuesses[oppGuesses.length - 1];
      if (lastOpp.result.every((r) => r === "correct")) {
        setOpponentSolved(true);
      }
    }
  }, [guesses, localIndex]);

  // Set won state for animation
  useEffect(() => {
    if (gameOver && winner === localIndex) {
      setWon(true);
    }
  }, [gameOver, winner, localIndex]);

  const shakeCurrentRow = useCallback(() => {
    const myGuessCount = guesses[localIndex]?.length ?? 0;
    setShakingRow(myGuessCount);
    setTimeout(() => setShakingRow(null), 500);
  }, [guesses, localIndex]);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver || localSolved || revealingGuess || disconnected) return;
      const myGuessCount = guesses[localIndex]?.length ?? 0;
      if (myGuessCount >= MAX_GUESSES) return;

      if (key === "Enter") {
        if (currentGuess.length < WORD_LENGTH) {
          setMessage("Not enough letters");
          setMessageType("error");
          shakeCurrentRow();
          return;
        }

        // Send to server for validation
        setRevealingGuess(true);
        setMessage("");
        setMessageType("");
        socketRef.current?.emit("submit-guess", { guess: currentGuess });

        // Wait for server response
        const handleResult = ({ playerIndex }: { playerIndex: number }) => {
          if (playerIndex === localIndex) {
            setCurrentGuess("");
            setRevealingGuess(false);
            socketRef.current?.off("guess-result", handleResult);
          }
        };
        const handleError = () => {
          setRevealingGuess(false);
          shakeCurrentRow();
          socketRef.current?.off("error-msg", handleError);
        };
        socketRef.current?.on("guess-result", handleResult);
        socketRef.current?.on("error-msg", handleError);

        // Timeout fallback
        setTimeout(() => {
          setRevealingGuess(false);
          socketRef.current?.off("guess-result", handleResult);
          socketRef.current?.off("error-msg", handleError);
        }, 5000);
      } else if (key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        setMessage("");
        setMessageType("");
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key);
        setMessage("");
        setMessageType("");
      }
    },
    [gameOver, localSolved, revealingGuess, disconnected, currentGuess, guesses, localIndex, shakeCurrentRow]
  );

  // Physical keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Don't capture if chat input is focused
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "Enter") handleKey("Enter");
      else if (e.key === "Backspace") handleKey("Backspace");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const handlePlayAgain = () => {
    setPlayAgainSent(true);
    socketRef.current?.emit("play-again");
  };

  const handleSendChat = (text: string) => {
    socketRef.current?.emit("chat-message", { text });
  };

  // ── RENDER ──

  // Error state
  if (errorMsg && !gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-red-400 text-xl mb-4">{errorMsg}</p>
        <a href="/" className="text-green-400 underline">Back to Home</a>
      </div>
    );
  }

  // Lobby (waiting for player 2)
  if (!gameStarted) {
    return <Lobby roomCode={roomCode} />;
  }

  // Game screen
  const opponentIndex = localIndex === 0 ? 1 : 0;
  const localPlayer = players.find((p) => p.index === localIndex);
  const opponentPlayer = players.find((p) => p.index === opponentIndex);

  let statusMessage = "";
  let statusType: "" | "error" | "success" = "";
  if (gameOver) {
    if (gameOverReason === "disconnect") {
      statusMessage = "Opponent disconnected - You win!";
      statusType = "success";
    } else if (winner === localIndex) {
      statusMessage = "You win!";
      statusType = "success";
    } else if (winner === opponentIndex) {
      statusMessage = `${opponentPlayer?.name || "Opponent"} wins!`;
      statusType = "error";
    } else {
      statusMessage = "It's a draw!";
      statusType = "";
    }
  } else if (message) {
    statusMessage = message;
    statusType = messageType;
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-2 px-2">
      {/* Header */}
      <header className="text-center border-b border-neutral-700 w-full max-w-[900px] pb-2 mb-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-[0.15em] uppercase">Wordle</h1>
        <p className="text-[10px] text-neutral-400 tracking-wider">
          Room: {roomCode}
        </p>
      </header>

      {/* Status message */}
      <div className={`h-7 flex items-center justify-center text-sm font-bold
        ${statusType === "error" ? "text-red-400" : ""}
        ${statusType === "success" ? "text-green-400" : ""}
        ${statusType === "" && statusMessage ? "text-yellow-400" : ""}`}>
        {statusMessage}
      </div>

      {/* Game Over info */}
      {gameOver && secretWords.length === 2 && (
        <div className="text-center mb-2">
          <p className="text-[11px] text-neutral-400">
            Your word: <span className="text-white font-bold uppercase">{secretWords[localIndex]}</span>
            {" | "}
            Their word: <span className="text-white font-bold uppercase">{secretWords[opponentIndex]}</span>
          </p>
          <div className="flex gap-3 justify-center mt-2">
            {!playAgainSent ? (
              <button
                onClick={handlePlayAgain}
                disabled={disconnected}
                className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700
                  text-white text-xs font-bold rounded uppercase tracking-wider cursor-pointer transition-colors"
              >
                {opponentWantsRematch ? "Accept Rematch" : "Play Again"}
              </button>
            ) : (
              <p className="text-neutral-400 text-xs">Waiting for opponent...</p>
            )}
            <a
              href="/"
              className="px-5 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-xs
                font-bold rounded uppercase tracking-wider transition-colors"
            >
              Leave
            </a>
          </div>
          {opponentWantsRematch && !playAgainSent && (
            <p className="text-yellow-400 text-xs mt-1">Opponent wants a rematch!</p>
          )}
        </div>
      )}

      {/* Boards side by side */}
      <div className="flex flex-row flex-wrap gap-4 sm:gap-8 items-start justify-center mb-3">
        {/* Local player board */}
        <PlayerBoard
          label={`You (${localPlayer?.name || "Player"})`}
          guesses={guesses[localIndex] || []}
          currentGuess={currentGuess}
          currentRow={guesses[localIndex]?.length ?? 0}
          maxGuesses={MAX_GUESSES}
          isLocal={true}
          solved={localSolved}
          shakingRow={shakingRow}
        />

        {/* Opponent board */}
        <PlayerBoard
          label={opponentPlayer?.name || "Opponent"}
          guesses={guesses[opponentIndex] || []}
          currentGuess=""
          currentRow={guesses[opponentIndex]?.length ?? 0}
          maxGuesses={MAX_GUESSES}
          isLocal={false}
          solved={opponentSolved}
          shakingRow={null}
        />
      </div>

      {/* Keyboard */}
      {!gameOver && (
        <Keyboard letterStatuses={letterStatuses} onKey={handleKey} />
      )}

      {/* Chat */}
      {gameStarted && (
        <Chat
          messages={chatMessages}
          onSend={handleSendChat}
          localPlayerIndex={localIndex}
        />
      )}

      {/* Win animation */}
      {won && <WinAnimation />}
    </div>
  );
}
