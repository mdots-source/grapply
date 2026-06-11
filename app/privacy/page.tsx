import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  title: "Privacy Policy | Grapply",
  description: "How Grapply handles demo requests, academy data, product data, cookies, and privacy choices.",
};

const sections = [
  {
    title: "Information we collect",
    copy: [
      "Demo requests may include your name, email, academy name, role, academy size, current tools, and message.",
      "Product accounts may include profile details, academy membership, role, belt rank, class activity, attendance, rankings, posts, competitions, and settings entered by your academy team.",
    ],
  },
  {
    title: "How we use it",
    copy: [
      "We use demo-request data to respond, prepare a walkthrough, and understand which academy workflows matter most.",
      "Academy data is used to operate product surfaces such as members, schedule, rankings, training feed, TV display, roles, and admin tools.",
    ],
  },
  {
    title: "Cookies and local storage",
    copy: [
      "Essential storage keeps theme, session and consent preferences working.",
      "Optional analytics or marketing cookies may be used only after you choose those preferences in the cookie banner.",
    ],
  },
  {
    title: "Sharing",
    copy: [
      "We do not sell academy or member data.",
      "We may use trusted service providers for hosting, email delivery, analytics, support, and security where needed to run Grapply.",
    ],
  },
  {
    title: "Retention and choices",
    copy: [
      "We keep demo requests and product records only as long as needed for sales, support, security, legal, and product operations.",
      "You can request access, correction, deletion, or export by contacting privacy@grapply.app.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo className="size-10" priority />
            <span>
              <span className="block text-sm font-black tracking-[0.18em]">Grapply</span>
              <span className="block text-xs text-[var(--muted)]">Privacy</span>
            </span>
          </Link>
          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold transition hover:bg-[var(--surface-hover)]">
            <ArrowLeft size={16} />
            Back
          </Link>
        </header>

        <section className="mt-12 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            <ShieldCheck size={14} />
            Last updated June 12, 2026
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">Privacy Policy</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Grapply is built for Brazilian Jiu-Jitsu academies. This policy explains how we handle demo requests, academy workspace data, cookies, and privacy choices.
          </p>
        </section>

        <div className="mt-6 grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.copy.map((copy) => (
                  <p key={copy} className="text-sm leading-7 text-[var(--muted)]">
                    {copy}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            For privacy requests, contact <a href="mailto:privacy@grapply.app" className="font-semibold text-[var(--accent)]">privacy@grapply.app</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
