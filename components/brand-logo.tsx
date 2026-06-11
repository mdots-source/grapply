import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  imageClassName,
  priority = false,
}: {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--surface)]", className)}>
      <Image
        src="/grapply-logo.png"
        alt="Grapply logo"
        fill
        sizes="44px"
        priority={priority}
        className={cn("object-cover", imageClassName)}
      />
    </span>
  );
}
