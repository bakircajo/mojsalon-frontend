import clsx from "clsx";

export default function TimeSlotGrid({
  slots,
  selected,
  onSelect,
  loading,
}: {
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-muted">Provjera slobodnih termina…</p>;
  }

  if (slots.length === 0) {
    return (
      <p className="rounded-sm border border-line bg-white px-4 py-3 text-sm text-muted">
        Nema slobodnih termina za izabrani datum. Pokušajte drugi dan.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onSelect(slot)}
          className={clsx(
            "focus-ring rounded-sm border px-2 py-2.5 font-mono text-sm transition-colors",
            selected === slot
              ? "border-ink bg-ink text-paper"
              : "border-line bg-white text-ink hover:border-ink"
          )}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
