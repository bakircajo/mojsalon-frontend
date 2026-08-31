"use client";

import { useRef, useState } from "react";

const MAX_DIMENSION = 256;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Skalira sliku na canvas (max 256x256, sačuvava razmjer), vraća data-URI + prosječnu boju.
 * Rad isključivo sa lokalnim fajlom (FileReader data-URI) je namjeran — čita se sa istog porijekla,
 * pa canvas.getImageData nikad ne baca CORS grešku (za razliku od proizvoljnog vanjskog URL-a). */
async function processLogoFile(file: File): Promise<{ dataUrl: string; suggestedColor: string | null }> {
  const rawDataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await loadImage(rawDataUrl);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: rawDataUrl, suggestedColor: null };

  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/png");

  let suggestedColor: string | null = null;
  try {
    const { data } = ctx.getImageData(0, 0, w, h);
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 128) continue; // preskoči providne piksele
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (count > 0) {
      const toHex = (v: number) => Math.round(v / count).toString(16).padStart(2, "0");
      suggestedColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
  } catch {
    // Sigurnosno ograničenje na canvas piksele (rijetko za data: URI, ali ne smije srušiti upload)
    suggestedColor = null;
  }

  return { dataUrl, suggestedColor };
}

export default function LogoUpload({
  value,
  onChange,
  onColorSuggestion,
}: {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  onColorSuggestion?: (hex: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Molimo odaberite sliku (PNG, JPG, SVG...).");
      return;
    }

    setError("");
    setProcessing(true);
    try {
      const { dataUrl, suggestedColor } = await processLogoFile(file);
      onChange(dataUrl);
      if (suggestedColor && onColorSuggestion) onColorSuggestion(suggestedColor);
    } catch {
      setError("Greška pri učitavanju slike. Pokušajte ponovo.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={processing}
        className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-4 text-left transition-all hover:border-neutral-500 disabled:opacity-60"
      >
        {value ? (
          <img src={value} alt="Logo" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-2xl">🖼️</div>
        )}
        <div>
          <p className="text-sm font-extrabold text-neutral-900">
            {processing ? "Obrada..." : value ? "Promijeni logo" : "Otpremi logo (opcionalno)"}
          </p>
          <p className="text-xs text-neutral-500">PNG, JPG ili SVG — automatski predlažemo boju iz loga.</p>
        </div>
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1.5 text-xs font-medium text-neutral-500 hover:text-red-600"
        >
          Ukloni logo
        </button>
      )}
    </div>
  );
}
