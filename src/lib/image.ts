/** Browser-only: shrinks a photo to a JPEG under the upload limit before it's sent with a booking. */
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This photo format isn't supported. Please use a JPEG or PNG.");
  });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Couldn't read this photo. Please try another.");
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}
