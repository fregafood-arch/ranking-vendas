import Image from "next/image";
import { getSellerPhotoUrl } from "@/lib/supabase/storage";

function initialsFor(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function SellerAvatar({
  photoPath,
  name,
  size = 40,
}: {
  photoPath: string | null | undefined;
  name: string;
  size?: number;
}) {
  const url = getSellerPhotoUrl(photoPath);

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-neutral-800 font-medium text-neutral-300"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initialsFor(name)}
    </div>
  );
}
