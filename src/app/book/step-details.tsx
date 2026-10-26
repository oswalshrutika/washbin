"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, X } from "lucide-react";
import { compressImage } from "@/lib/image";

const MAX_PHOTOS = 3;

export function StepDetails({
  instructions,
  setInstructions,
  photos,
  setPhotos,
}: {
  instructions: string;
  setInstructions: (s: string) => void;
  photos: File[];
  setPhotos: (p: File[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const previews = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      if (files.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`);
      const compressed = await Promise.all([...files].slice(0, room).map((f) => compressImage(f)));
      setPhotos([...photos, ...compressed]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add this photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Anything the team should know?</h2>
      <p className="mt-1 text-ink-soft">Both are optional.</p>

      <label className="label mt-5" htmlFor="instructions">
        Instructions
      </label>
      <textarea
        id="instructions"
        rows={4}
        maxLength={1000}
        className="field py-3"
        placeholder="For example: tank is on the terrace, key with the watchman. We have a dog."
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />

      <p className="label mt-5">Photos (up to {MAX_PHOTOS})</p>
      <p className="-mt-1 mb-2 text-sm text-ink-soft">A photo of the sofa stains or the tank access helps the team bring the right kit.</p>
      <div className="flex flex-wrap gap-3">
        {previews.map((url, i) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={url} alt={`Photo ${i + 1}`} className="size-24 rounded-[var(--radius-tile)] object-cover" />
            <button
              type="button"
              className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-ink text-white"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="grid size-24 cursor-pointer place-items-center rounded-[var(--radius-tile)] border-2 border-dashed border-ink/25 text-ink-soft hover:border-ink/50 has-focus-visible:outline-3 has-focus-visible:outline-teal">
            <span className="flex flex-col items-center text-sm">
              <Camera className="size-6" aria-hidden />
              {busy ? "Adding…" : "Add photo"}
            </span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => add(e.target.files)} disabled={busy} />
          </label>
        )}
      </div>
      {error && <p className="mt-2 text-brick">{error}</p>}
    </div>
  );
}
