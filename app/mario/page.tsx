import type { Metadata } from "next";
import { MarioBirthdayQuiz } from "@/components/mario-birthday-quiz";

export const metadata: Metadata = {
  title: "Mario Joke Battle | Grapply",
  description: "A tiny birthday joke battle quiz.",
};

export default function MarioPage() {
  return <MarioBirthdayQuiz />;
}
