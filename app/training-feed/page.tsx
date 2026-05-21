import { MessageCircle, Radio, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageTransition } from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { feed } from "@/data/academy";

export default function TrainingFeedPage() {
  return (
    <AppShell title="Training Feed" subtitle="A social activity timeline for class recaps, sparring highlights, promotion signals, and community momentum.">
      <PageTransition>
        <div className="mx-auto max-w-3xl space-y-5">
          {feed.map((post) => (
            <Card key={post.id} className="p-0">
              <div className="border-b border-[var(--border)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Badge><Radio size={14} /> {post.author}</Badge>
                    <h2 className="mt-4 text-2xl font-semibold">{post.title}</h2>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)] px-3 py-2 text-center text-[var(--accent-foreground)]">
                    <p className="text-xl font-black">{post.heat}</p>
                    <p className="text-[10px] font-bold uppercase">heat</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{post.text}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-[var(--muted)]">
                <span>{post.meta}</span>
                <div className="flex gap-2">
                  <Badge><Zap size={14} /> Boost</Badge>
                  <Badge><MessageCircle size={14} /> Discuss</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageTransition>
    </AppShell>
  );
}
