import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StravaConnectButton({
  href,
  children = "Connect with Strava",
  className,
  size = "default",
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  return (
    <Button variant="ghost" size={size} className={cn("strava-button justify-center", className)} asChild>
      <Link href={href}>
        <span className="strava-button-mark" aria-hidden="true">
          <Activity size={16} />
        </span>
        <span>{children}</span>
      </Link>
    </Button>
  );
}
