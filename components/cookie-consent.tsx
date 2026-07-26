"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const storageKey = "grapply-cookie-preferences";
const hiddenPathPrefixes = ["/app", "/mario"];

type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

export function CookieConsent() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (hiddenPathPrefixes.some((prefix) => pathname?.startsWith(prefix))) return;
    const saved = window.localStorage.getItem(storageKey);
    setOpen(!saved);

    function openPreferences() {
      setManage(true);
      setOpen(true);
    }

    window.addEventListener("grapply:open-cookie-preferences", openPreferences);
    return () => window.removeEventListener("grapply:open-cookie-preferences", openPreferences);
  }, [pathname]);

  if (hiddenPathPrefixes.some((prefix) => pathname?.startsWith(prefix))) return null;

  function savePreferences(next: Pick<CookiePreferences, "analytics" | "marketing">) {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: next.analytics,
      marketing: next.marketing,
      decidedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    setOpen(false);
    setManage(false);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] p-4 shadow-[var(--shadow)] backdrop-blur-2xl sm:bottom-5 sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                <ShieldCheck size={19} />
              </div>
              <div>
                <h2 className="text-base font-semibold">Cookie preferences</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  We use essential storage for the product experience and optional cookies to understand landing-page performance.
                </p>
              </div>
            </div>
            <button type="button" aria-label="Close cookie settings" onClick={() => setOpen(false)} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
              <X size={17} />
            </button>
          </div>

          {manage ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid gap-2">
              <PreferenceRow title="Necessary" copy="Theme, security, session and consent state. Always on." checked disabled />
              <PreferenceRow title="Analytics" copy="Helps us understand which product sections owners care about." checked={analytics} onChange={setAnalytics} />
              <PreferenceRow title="Marketing" copy="Helps us measure demo demand and campaign performance." checked={marketing} onChange={setMarketing} />
            </motion.div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/privacy" className="text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]">
              Privacy policy
            </Link>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setManage((value) => !value)}>
                <Settings2 />
                {manage ? "Hide settings" : "Manage"}
              </Button>
              <Button type="button" variant="surface" onClick={() => savePreferences({ analytics: false, marketing: false })}>
                Essential only
              </Button>
              <Button type="button" variant="primary" onClick={() => savePreferences({ analytics: true, marketing: true })}>
                Accept all
              </Button>
              {manage ? (
                <Button type="button" variant="outline" onClick={() => savePreferences({ analytics, marketing })}>
                  Save
                </Button>
              ) : null}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function PreferenceRow({
  title,
  copy,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  copy: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{copy}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="size-5 accent-[var(--accent)]"
      />
    </label>
  );
}
