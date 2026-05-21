"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DayButtonProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
        "hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60",
        modifiers.selected && "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]",
        modifiers.inSelectedWeek && !modifiers.selected && "bg-[var(--accent)]/12 text-[var(--foreground)]",
        modifiers.today && !modifiers.selected && "border border-[var(--accent)]/35 text-[var(--accent)]",
        modifiers.outside && "text-[var(--muted)] opacity-60",
        modifiers.disabled && "pointer-events-none opacity-30",
        className,
      )}
      {...props}
    >
      {day.date.getDate()}
    </button>
  );
}

function Calendar({ className, classNames, showOutsideDays = true, components, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: cn("relative", defaults.root),
        months: cn("flex flex-col gap-3", defaults.months),
        month: cn("space-y-3", defaults.month),
        month_caption: cn("relative flex items-center justify-center px-10", defaults.month_caption),
        caption_label: cn("text-sm font-semibold text-[var(--foreground)]", defaults.caption_label),
        nav: cn("flex items-center gap-1", defaults.nav),
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "absolute left-1 top-0 size-8 text-[var(--muted)] hover:text-[var(--foreground)]",
          defaults.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "absolute right-1 top-0 size-8 text-[var(--muted)] hover:text-[var(--foreground)]",
          defaults.button_next,
        ),
        month_grid: cn("w-full border-collapse", defaults.month_grid),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn("w-9 text-center text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]", defaults.weekday),
        week: cn("mt-1 flex w-full", defaults.week),
        day: cn("p-0 text-center", defaults.day),
        day_button: cn("h-9 w-9", defaults.day_button),
        outside: cn("text-[var(--muted)]", defaults.outside),
        disabled: cn("opacity-30", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("size-4", chevronClassName)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
