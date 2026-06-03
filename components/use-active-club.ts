"use client";

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";

type ActiveClub = {
  name: string;
  slug: string;
};

const ActiveClubContext = createContext<ActiveClub | null | undefined>(undefined);

export function ActiveClubProvider({ activeClub, children }: { activeClub?: ActiveClub | null; children: ReactNode }) {
  return createElement(ActiveClubContext.Provider, { value: activeClub ?? null }, children);
}

export function useActiveClub() {
  return useActiveClubState().activeClub;
}

export function useActiveClubState() {
  const initialActiveClub = useContext(ActiveClubContext);
  const hasInitialActiveClub = initialActiveClub !== undefined;
  const [activeClub, setActiveClub] = useState<ActiveClub | null>(initialActiveClub ?? null);
  const [loading, setLoading] = useState(!hasInitialActiveClub);

  useEffect(() => {
    if (!hasInitialActiveClub) return;
    setActiveClub(initialActiveClub ?? null);
    setLoading(false);
  }, [hasInitialActiveClub, initialActiveClub]);

  useEffect(() => {
    let alive = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { activeClub?: ActiveClub | null } | null) => {
        if (!alive) return;
        setActiveClub(payload?.activeClub ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setActiveClub(null);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { activeClub, loading };
}
