import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Local disk storage for pass 1. Swap for S3/GCS by keeping the same save/read signatures.
 * Vercel's app folder is read-only, so demo deploys write to /tmp (photos there don't persist).
 */
const ROOT = process.env.VERCEL
  ? path.join(tmpdir(), "washbin-uploads")
  : path.join(process.cwd(), "storage", "uploads");

export const PHOTO_LIMITS = { maxFiles: 3, maxBytes: 2 * 1024 * 1024 };

const SIGNATURES: { ext: string; type: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", type: "image/png", test: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
  { ext: "webp", type: "image/webp", test: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
];

export class UploadError extends Error {}

/** Checks files before anything is written, so a bad upload can't leave a half-created booking. */
export async function readPhotos(files: File[]) {
  if (files.length > PHOTO_LIMITS.maxFiles) throw new UploadError(`You can add up to ${PHOTO_LIMITS.maxFiles} photos`);
  return Promise.all(
    files.map(async (f) => {
      if (f.size > PHOTO_LIMITS.maxBytes) throw new UploadError("Each photo must be under 2 MB");
      const buf = Buffer.from(await f.arrayBuffer());
      const kind = SIGNATURES.find((s) => s.test(buf));
      if (!kind) throw new UploadError("Photos must be JPEG, PNG or WebP images");
      return { buf, ext: kind.ext };
    }),
  );
}

export async function savePhotos(folder: string, photos: { buf: Buffer; ext: string }[]): Promise<string[]> {
  if (!photos.length) return [];
  await mkdir(path.join(ROOT, folder), { recursive: true });
  return Promise.all(
    photos.map(async ({ buf, ext }) => {
      const rel = `${folder}/${randomUUID()}.${ext}`;
      await writeFile(path.join(ROOT, rel), buf);
      return rel;
    }),
  );
}

export async function readUpload(rel: string) {
  const full = path.join(ROOT, rel);
  if (!full.startsWith(ROOT + path.sep)) throw new UploadError("Invalid path");
  const ext = path.extname(full).slice(1);
  return { data: await readFile(full), type: SIGNATURES.find((s) => s.ext === ext)?.type ?? "application/octet-stream" };
}
