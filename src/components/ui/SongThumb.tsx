import Image from "next/image";

// Miniatura de canción con fallback si no hay thumbnail.
export function SongThumb({
  src,
  alt,
  size = 56,
}: {
  src: string | null | undefined;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg bg-base-600 text-lg"
        style={{ width: size, height: size }}
      >
        🎵
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-lg object-cover"
      unoptimized
    />
  );
}
