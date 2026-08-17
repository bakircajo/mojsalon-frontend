"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { updateShop, ApiError } from "@/lib/api";
import type { Shop } from "@/lib/types";

const DAYS_TRANSLATION: Record<string, string> = {
  monday: "Ponedjeljak",
  tuesday: "Utorak",
  wednesday: "Srijeda",
  thursday: "Četvrtak",
  friday: "Petak",
  saturday: "Subota",
  sunday: "Nedjelja",
};

interface DayHours {
  start: string;
  end: string;
  is_working: boolean;
}

type WorkingHoursMap = Record<string, DayHours>;

const DEFAULT_HOURS: WorkingHoursMap = {
  monday: { start: "08:00", end: "16:00", is_working: true },
  tuesday: { start: "08:00", end: "16:00", is_working: true },
  wednesday: { start: "08:00", end: "16:00", is_working: true },
  thursday: { start: "08:00", end: "16:00", is_working: true },
  friday: { start: "08:00", end: "16:00", is_working: true },
  saturday: { start: "08:00", end: "14:00", is_working: true },
  sunday: { start: "00:00", end: "00:00", is_working: false },
};

export default function AdminWorkingHours({ shop }: { shop: Shop }) {
  const [hours, setHours] = useState<WorkingHoursMap>(() => {
    return {
      ...DEFAULT_HOURS,
      ...(shop?.working_hours || {}),
    };
  });

  useEffect(() => {
    if (shop?.working_hours) {
      setHours({
        ...DEFAULT_HOURS,
        ...shop.working_hours,
      });
    }
  }, [shop]);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleChange = (day: string, field: keyof DayHours, value: any) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!shop?.id) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      await updateShop(shop.id, { working_hours: hours });
      setStatusMessage({ text: "Radno vrijeme uspješno sačuvano!", type: "success" });
    } catch (err) {
      console.error("Greška pri spašavanju radnog vremena:", err);
      setStatusMessage({
        text: err instanceof ApiError ? err.message : "Neuspješno spašavanje radnog vremena.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 mt-8">
      <h3 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">
        Podešavanje Radnog Vremena
      </h3>

      <div className="flex flex-col gap-4">
        {Object.keys(DEFAULT_HOURS).map((dayKey) => {
          const dayData = hours[dayKey] || DEFAULT_HOURS[dayKey];
          return (
            <div
              key={dayKey}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0"
            >
              <div className="w-32 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`working-${dayKey}`}
                  checked={dayData.is_working}
                  onChange={(e) => handleChange(dayKey, "is_working", e.target.checked)}
                  className="rounded border-gray-700 bg-black/40 text-amber-600 focus:ring-amber-500"
                />
                <label
                  htmlFor={`working-${dayKey}`}
                  className={`text-sm font-medium ${
                    dayData.is_working ? "text-ink" : "text-muted line-through"
                  }`}
                >
                  {DAYS_TRANSLATION[dayKey]}
                </label>
              </div>

              {dayData.is_working ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={dayData.start}
                    onChange={(e) => handleChange(dayKey, "start", e.target.value)}
                    className="w-28 text-xs"
                  />
                  <span className="text-muted text-xs">do</span>
                  <Input
                    type="time"
                    value={dayData.end}
                    onChange={(e) => handleChange(dayKey, "end", e.target.value)}
                    className="w-28 text-xs"
                  />
                </div>
              ) : (
                <span className="text-xs text-muted italic">Neradni dan</span>
              )}
            </div>
          );
        })}
      </div>

      {statusMessage && (
        <p
          className={`mt-4 text-sm ${
            statusMessage.type === "success" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {statusMessage.text}
        </p>
      )}

      <div className="mt-6">
        <Button onClick={handleSave} loading={saving}>
          Sačuvaj radno vrijeme
        </Button>
      </div>
    </Card>
  );
}