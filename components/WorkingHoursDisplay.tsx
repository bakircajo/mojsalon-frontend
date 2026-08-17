"use client";

import Card from "@/components/ui/Card";
import type { WorkingHoursMap } from "@/lib/types";

const DAYS_TRANSLATION: Record<string, string> = {
  monday: "Ponedjeljak",
  tuesday: "Utorak",
  wednesday: "Srijeda",
  thursday: "Četvrtak",
  friday: "Petak",
  saturday: "Subota",
  sunday: "Nedjelja",
};

const ORDERED_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function WorkingHoursDisplay({
  workingHours,
}: {
  workingHours?: WorkingHoursMap | null;
}) {
  if (!workingHours) return null;

  return (
    <Card className="p-6">
      <h3 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">
        Radno Vrijeme
      </h3>

      <div className="flex flex-col gap-2.5">
        {ORDERED_DAYS.map((dayKey) => {
          const dayData = workingHours[dayKey];
          if (!dayData) return null;

          return (
            <div
              key={dayKey}
              className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0"
            >
              <span className="text-muted font-medium">
                {DAYS_TRANSLATION[dayKey]}
              </span>

              {dayData.is_working ? (
                <span className="font-mono text-ink">
                  {dayData.start} – {dayData.end}
                </span>
              ) : (
                <span className="text-xs text-rose-400/80 font-mono italic">
                  Zatvoreno
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}