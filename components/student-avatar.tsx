import Image from "next/image";
import { beltStyles, type Student } from "@/data/academy";
import { cn, initials } from "@/lib/utils";

export function StudentAvatar({
  student,
  size = "md",
  className,
  priority = false,
}: {
  student: Pick<Student, "name" | "belt" | "avatar">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}) {
  const sizes = {
    sm: "size-9 rounded-lg",
    md: "size-11 rounded-xl",
    lg: "size-16 rounded-2xl",
    xl: "size-24 rounded-[20px]",
  };

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_40px_rgba(0,0,0,0.28)]",
        sizes[size],
        className,
      )}
      style={{ boxShadow: `0 0 0 1px ${beltStyles[student.belt].hex}33, 0 18px 50px rgba(0,0,0,.35)` }}
    >
      {student.avatar ? (
        <Image
          src={student.avatar}
          alt={`${student.name} avatar`}
          fill
          sizes={size === "xl" ? "96px" : size === "lg" ? "64px" : "44px"}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center text-xs font-black text-[var(--foreground)]"
          style={{ background: `linear-gradient(135deg, ${beltStyles[student.belt].hex}66, rgba(255,255,255,.06))` }}
        >
          {initials(student.name)}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: beltStyles[student.belt].hex }} />
    </div>
  );
}
