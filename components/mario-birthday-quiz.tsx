"use client";

import { useEffect, useMemo, useState } from "react";

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
const gameKey = "mario-birthday-game-v2";

export function MarioBirthdayQuiz() {
  const [jokes, setJokes] = useState(defaultJokes);
  const [game, setGame] = useState<GameState>(() => createGame(defaultJokes));
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(defaultJokes.join("\n"));
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
    setDraft(storedJokes.join("\n"));
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

  const reversedHistory = useMemo(() => [...game.history].reverse(), [game.history]);

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

  function undo() {
    setGame((current) => {
      const previous = current.history.at(-1);
      if (!previous) return current;

      return {
        champion: previous.left,
        challengerIndex: Math.max(1, current.challengerIndex - 1),
        history: current.history.slice(0, -1),
      };
    });
  }

  function reset(nextJokes = jokes) {
    setGame(createGame(nextJokes));
  }

  function saveJokes() {
    const nextJokes = sanitizeJokes(draft.split("\n"));
    setJokes(nextJokes);
    setDraft(nextJokes.join("\n"));
    window.localStorage.setItem(jokesKey, JSON.stringify(nextJokes));
    setGame(createGame(nextJokes));
    setEditorOpen(false);
  }

  function restoreDemo() {
    setJokes(defaultJokes);
    setDraft(defaultJokes.join("\n"));
    window.localStorage.removeItem(jokesKey);
    setGame(createGame(defaultJokes));
  }

  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#08080c] text-[#f7f4ec]">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-7 lg:p-8">
          <p className="mb-3 text-xs font-black uppercase text-[#ffd166]">Birthday edition</p>
          <h1 className="max-w-3xl text-4xl font-black leading-none sm:text-6xl lg:text-7xl">Mario Joke Battle</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#b6ad9c] sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">
            Выбирай, какая шутка смешнее. Победитель идёт дальше, пока не найдём главную легенду вечера.
          </p>
        </section>

        <section className="mt-3 rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:mt-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 text-sm font-black text-[#b6ad9c]">
            <span>{finished ? "Done" : `Round ${completedRounds + 1}`}</span>
            <span>{completedRounds} / {totalRounds}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#ff3d6e,#ffd166)] transition-all" style={{ width: `${Math.round((completedRounds / totalRounds) * 100)}%` }} />
          </div>

          {finished ? (
            <div className="mt-5 rounded-3xl border border-[#61e8b4]/35 bg-[#61e8b4]/10 p-5 sm:p-6">
              <p className="mb-3 text-xs font-black uppercase text-[#ffd166]">Winner</p>
              <h2 className="text-4xl font-black leading-none sm:text-6xl">{game.champion}</h2>
              <p className="mt-4 text-sm leading-6 text-[#b6ad9c]">Вот она, официально самая смешная шутка по версии именинника.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)]">
              <ChoiceCard kicker="Current winner" text={game.champion} onClick={() => choose("left")} />
              <div className="grid h-9 w-12 place-items-center self-center justify-self-center rounded-full border border-[#ff3d6e]/30 bg-[#ff3d6e]/10 text-xs font-black uppercase text-[#ff3d6e] md:h-12">
                vs
              </div>
              <ChoiceCard kicker="Next from list" text={challenger ?? ""} onClick={() => choose("right")} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton onClick={undo} disabled={game.history.length === 0}>Назад</ActionButton>
            <ActionButton onClick={() => reset()}>Сбросить игру</ActionButton>
            <ActionButton onClick={() => setEditorOpen((value) => !value)}>Редактировать шутки</ActionButton>
          </div>
        </section>

        <section className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">История выбора</h2>
              <span className="text-sm font-black text-[#b6ad9c]">{game.history.length}</span>
            </div>
            {reversedHistory.length > 0 ? (
              <ol className="mt-4 grid gap-2 pl-5 text-sm leading-6 text-[#b6ad9c]">
                {reversedHistory.map((item) => (
                  <li key={`${item.round}-${item.winner}`}>
                    <strong className="text-[#f7f4ec]">{item.winner}</strong> победила: {item.loser}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-[#b6ad9c]">Пока нет выборов. Самое смешное ещё впереди.</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Жёсткость</h2>
              <span className="text-sm font-black text-[#b6ad9c]">{jokes.length}</span>
            </div>
            <ol className="mt-4 max-h-[340px] space-y-2 overflow-y-auto pr-1 text-sm text-[#b6ad9c] lg:max-h-[420px]">
              {jokes.map((joke, index) => (
                <li key={`${joke}-${index}`} className="flex items-start gap-2">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-black text-[#ffd166]">{index + 1}</span>
                  <span className="min-w-0 break-words leading-6">{joke}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {editorOpen && (
          <section className="mt-3 rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:mt-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Список шуток</h2>
              <span className="text-xs font-black text-[#b6ad9c]">1 строка = 1 шутка</span>
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck={false}
              className="mt-4 min-h-[240px] w-full resize-y rounded-[20px] border border-white/15 bg-black/25 p-4 text-sm leading-6 text-[#f7f4ec] outline-none transition focus:border-[#ffd166]/60"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={saveJokes} className="min-h-11 rounded-full bg-[#ff3d6e] px-5 text-sm font-black text-white transition hover:brightness-110">
                Сохранить
              </button>
              <ActionButton onClick={restoreDemo}>Вернуть демо</ActionButton>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ChoiceCard({ kicker, text, onClick }: { kicker: string; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[132px] rounded-3xl border border-white/15 bg-[#14141d] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#ffd166]/60 hover:bg-[#1d1d29] sm:min-h-[172px] sm:p-6 md:min-h-[210px]"
    >
      <span className="mb-3 block text-xs font-black uppercase text-[#ffd166] sm:mb-4">{kicker}</span>
      <span className="block break-words text-2xl font-black leading-tight sm:text-4xl md:text-3xl lg:text-4xl">{text}</span>
    </button>
  );
}

function ActionButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-11 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-bold text-[#f7f4ec] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
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
