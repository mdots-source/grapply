"use client";

import { useEffect, useState } from "react";

type HistoryItem = {
  round: number;
  left: string;
  right: string;
  winner: string;
  loser: string;
};

type GameState = {
  champion: string;
  challengerIndex: number;
  history: HistoryItem[];
};

const defaultJokes = [
  "Mama bought shoes",
  "Citro",
  "Pinacolada",
  "Claudio bestie",
  "Albanian on BMW",
  "Serbian",
  "leather Jacket",
  "Speak Italian",
  "Chezh Friends",
  "Party Animals",
  "BarberShop",
  "Wax for hair",
  "Porta Party",
  "Tofu Puding",
  "Washing Asses",
  "Secret son of Burim",
  "Papa is Raja",
];

const jokesKey = "mario-birthday-jokes-v2";
const gameKey = "mario-birthday-game-v3";

export function MarioBirthdayQuiz() {
  const [jokes, setJokes] = useState(defaultJokes);
  const [game, setGame] = useState<GameState>(() => createGame(defaultJokes));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedJokes = sanitizeJokes(readJson<string[]>(jokesKey) ?? defaultJokes);
    const storedGame = readJson<(GameState & { jokesHash?: string })>(gameKey);
    const nextGame = storedGame?.jokesHash === getJokesHash(storedJokes)
      ? {
          champion: storedGame.champion,
          challengerIndex: storedGame.challengerIndex,
          history: Array.isArray(storedGame.history) ? storedGame.history : [],
        }
      : createGame(storedJokes);

    setJokes(storedJokes);
    setGame(nextGame);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(gameKey, JSON.stringify({ ...game, jokesHash: getJokesHash(jokes) }));
  }, [game, jokes, loaded]);

  const finished = game.challengerIndex >= jokes.length;
  const totalRounds = Math.max(jokes.length - 1, 1);
  const completedRounds = Math.min(game.history.length, totalRounds);
  const challenger = jokes[game.challengerIndex];

  function choose(side: "left" | "right") {
    if (finished || !challenger) return;

    setGame((current) => {
      const winner = side === "left" ? current.champion : jokes[current.challengerIndex];
      const loser = side === "left" ? jokes[current.challengerIndex] : current.champion;

      return {
        champion: winner,
        challengerIndex: current.challengerIndex + 1,
        history: [
          ...current.history,
          {
            round: current.history.length + 1,
            left: current.champion,
            right: jokes[current.challengerIndex],
            winner,
            loser,
          },
        ],
      };
    });
  }

  function reset(nextJokes = jokes) {
    setGame(createGame(nextJokes));
  }

  return (
    <main className="min-h-[100svh] overflow-hidden bg-[#08080c] text-[#f7f4ec]">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col gap-3 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-5 lg:px-7">
        <header className="flex shrink-0 items-center justify-between gap-3 text-xs font-black uppercase text-[#b6ad9c] sm:text-sm">
          <span>Mario Joke Battle</span>
          <span>{finished ? "Winner" : `${completedRounds + 1} / ${totalRounds}`}</span>
        </header>

        <div className="h-1.5 shrink-0 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ff3d6e,#ffd166)] transition-all"
            style={{ width: `${Math.round((completedRounds / totalRounds) * 100)}%` }}
          />
        </div>

        {finished ? (
          <button
            type="button"
            onClick={() => reset()}
            className="grid flex-1 place-items-center rounded-[2rem] border border-[#61e8b4]/35 bg-[#61e8b4]/10 p-5 text-center transition hover:bg-[#61e8b4]/15"
          >
            <span>
              <span className="mb-4 block text-sm font-black uppercase text-[#ffd166]">Winner</span>
              <span className="block break-words text-5xl font-black leading-none sm:text-7xl lg:text-8xl">{game.champion}</span>
              <span className="mt-6 block text-sm font-black uppercase text-[#b6ad9c]">Tap to restart</span>
            </span>
          </button>
        ) : (
          <section className="grid flex-1 min-h-0 gap-3 md:grid-cols-2">
            <ChoiceButton text={game.champion} onClick={() => choose("left")} />
            <ChoiceButton text={challenger ?? ""} onClick={() => choose("right")} />
          </section>
        )}
      </div>
    </main>
  );
}

function ChoiceButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[240px] rounded-[2rem] border border-white/15 bg-[#14141d] p-5 text-center transition hover:-translate-y-0.5 hover:border-[#ffd166]/70 hover:bg-[#1d1d29] active:scale-[0.99] sm:min-h-[320px] sm:p-8 md:min-h-0"
    >
      <span className="mx-auto flex h-full max-w-[14ch] items-center justify-center break-words text-5xl font-black leading-none sm:text-7xl md:text-6xl lg:text-7xl xl:text-8xl">
        {text}
      </span>
    </button>
  );
}

function createGame(jokes: string[]): GameState {
  return {
    champion: jokes[0] ?? "",
    challengerIndex: 1,
    history: [],
  };
}

function sanitizeJokes(items: string[]) {
  const jokes = items.map((item) => item.trim()).filter(Boolean);
  return jokes.length >= 2 ? jokes : defaultJokes;
}

function readJson<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

function getJokesHash(jokes: string[]) {
  return jokes.join("|").toLowerCase();
}
