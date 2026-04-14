import express from "express";
import { createServer } from "http";
import next from "next";
import { Server, Socket } from "socket.io";
import { WORDS, VALID_GUESSES } from "./lib/words.js";

// ── evaluate (duplicated from lib so server can run standalone) ──
type LetterStatus = "correct" | "present" | "absent";

function evaluateGuess(guess: string, target: string): LetterStatus[] {
  const result: LetterStatus[] = Array(5).fill("absent");
  const targetArr = target.split("");
  const guessArr = guess.split("");
  const used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
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

function pickWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Types ──
const MAX_GUESSES = 8;

interface GuessEntry {
  word: string;
  result: LetterStatus[];
}

interface Player {
  socketId: string;
  name: string;
  index: number; // 0 or 1
  secretWord: string;
  guesses: GuessEntry[];
  solved: boolean;
}

interface Room {
  code: string;
  players: Player[];
  started: boolean;
  finished: boolean;
  winner: number | null; // 0, 1, or null (draw)
  playAgainVotes: Set<string>;
}

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();

// ── Next.js + Express + Socket.IO ──
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const httpServer = createServer(expressApp);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket: Socket) => {
    // ── Create Room ──
    socket.on("create-room", ({ playerName, roomCode: requestedCode }: { playerName: string; roomCode?: string }) => {
      let code = requestedCode?.toUpperCase() || generateRoomCode();
      while (rooms.has(code)) code = generateRoomCode();

      const player: Player = {
        socketId: socket.id,
        name: playerName || "Player 1",
        index: 0,
        secretWord: "",
        guesses: [],
        solved: false,
      };

      const room: Room = {
        code,
        players: [player],
        started: false,
        finished: false,
        winner: null,
        playAgainVotes: new Set(),
      };

      rooms.set(code, room);
      socketToRoom.set(socket.id, code);
      socket.join(code);
      socket.emit("room-created", { roomCode: code });
    });

    // ── Join Room ──
    socket.on("join-room", ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      const code = roomCode.toUpperCase();
      const room = rooms.get(code);

      if (!room) {
        socket.emit("error-msg", { message: "Room not found" });
        return;
      }
      if (room.players.length >= 2) {
        socket.emit("error-msg", { message: "Room is full" });
        return;
      }
      if (room.started) {
        socket.emit("error-msg", { message: "Game already in progress" });
        return;
      }

      const player: Player = {
        socketId: socket.id,
        name: playerName || "Player 2",
        index: 1,
        secretWord: "",
        guesses: [],
        solved: false,
      };

      room.players.push(player);
      socketToRoom.set(socket.id, code);
      socket.join(code);

      // Start the game
      startGame(room, io);
    });

    // ── Submit Guess ──
    socket.on("submit-guess", ({ guess }: { guess: string }) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || !room.started || room.finished) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;
      if (player.solved) return;
      if (player.guesses.length >= MAX_GUESSES) return;

      const word = guess.toLowerCase();
      if (word.length !== 5) {
        socket.emit("error-msg", { message: "Not enough letters" });
        return;
      }
      if (!VALID_GUESSES.has(word)) {
        socket.emit("error-msg", { message: "Not in word list" });
        return;
      }

      const result = evaluateGuess(word, player.secretWord);
      const entry: GuessEntry = { word, result };
      player.guesses.push(entry);

      const isSolved = result.every((r) => r === "correct");
      if (isSolved) player.solved = true;

      // Broadcast to all in room
      io.to(code).emit("guess-result", {
        playerIndex: player.index,
        guess: word,
        result,
        guessIndex: player.guesses.length - 1,
      });

      // Check win conditions
      checkGameOver(room, io);
    });

    // ── Chat ──
    socket.on("chat-message", ({ text }: { text: string }) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      io.to(code).emit("chat-message", {
        playerIndex: player.index,
        playerName: player.name,
        text: text.slice(0, 200), // limit length
      });
    });

    // ── Play Again ──
    socket.on("play-again", () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || !room.finished) return;

      room.playAgainVotes.add(socket.id);

      if (room.playAgainVotes.size === 1) {
        // Tell the other player someone wants to play again
        socket.to(code).emit("play-again-requested", {
          playerIndex: room.players.find((p) => p.socketId === socket.id)?.index,
        });
      }

      if (room.playAgainVotes.size >= 2) {
        // Both want to play again
        startGame(room, io);
      }
    });

    // ── Disconnect ──
    socket.on("disconnect", () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      socketToRoom.delete(socket.id);

      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);

      // If game is in progress, end it
      if (room.started && !room.finished) {
        room.finished = true;
        const otherPlayer = room.players.find((p) => p.socketId !== socket.id);
        if (otherPlayer) {
          room.winner = otherPlayer.index;
        }
        io.to(code).emit("opponent-disconnected", {
          playerName: player?.name || "Opponent",
        });
        io.to(code).emit("game-over", {
          winner: room.winner,
          words: room.players.map((p) => p.secretWord),
          reason: "disconnect",
        });
      }

      // Clean up if room is empty
      const remaining = room.players.filter((p) => p.socketId !== socket.id);
      if (remaining.length === 0) {
        rooms.delete(code);
      } else {
        // Also notify lobby if game hasn't started
        if (!room.started) {
          rooms.delete(code);
          io.to(code).emit("opponent-disconnected", {
            playerName: player?.name || "Opponent",
          });
        }
      }
    });
  });

  // Next.js handles all routes
  expressApp.all("/{*path}", (req: any, res: any) => handle(req, res));

  const port = parseInt(process.env.PORT || "3000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});

function startGame(room: Room, io: Server) {
  // Pick unique secret words for each player
  const word1 = pickWord();
  let word2 = pickWord();
  while (word2 === word1) word2 = pickWord();

  room.players[0].secretWord = word1;
  room.players[0].guesses = [];
  room.players[0].solved = false;
  room.players[1].secretWord = word2;
  room.players[1].guesses = [];
  room.players[1].solved = false;
  room.started = true;
  room.finished = false;
  room.winner = null;
  room.playAgainVotes = new Set();

  // Tell each player their index and player names
  for (const player of room.players) {
    const sock = io.sockets.sockets.get(player.socketId);
    if (sock) {
      sock.emit("game-start", {
        playerIndex: player.index,
        players: room.players.map((p) => ({ name: p.name, index: p.index })),
      });
    }
  }
}

function checkGameOver(room: Room, io: Server) {
  const p0 = room.players[0];
  const p1 = room.players[1];

  const p0Done = p0.solved || p0.guesses.length >= MAX_GUESSES;
  const p1Done = p1.solved || p1.guesses.length >= MAX_GUESSES;

  let winner: number | null = null;
  let finished = false;

  // If someone just solved it
  if (p0.solved && !p1.solved) {
    winner = 0;
    finished = true;
  } else if (p1.solved && !p0.solved) {
    winner = 1;
    finished = true;
  } else if (p0.solved && p1.solved) {
    // Both solved — whoever used fewer guesses wins
    if (p0.guesses.length < p1.guesses.length) winner = 0;
    else if (p1.guesses.length < p0.guesses.length) winner = 1;
    else winner = null; // draw
    finished = true;
  } else if (p0Done && p1Done) {
    // Both ran out of guesses
    winner = null; // draw
    finished = true;
  }

  if (finished) {
    room.finished = true;
    room.winner = winner;
    io.to(room.code).emit("game-over", {
      winner,
      words: [p0.secretWord, p1.secretWord],
      reason: "complete",
    });
  }
}
