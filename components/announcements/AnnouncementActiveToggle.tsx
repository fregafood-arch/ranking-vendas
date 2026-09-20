"use client";

import { useTransition } from "react";
import { setAnnouncementActive } from "@/lib/actions/announcements.actions";

export function AnnouncementActiveToggle({
  announcementId,
  isActive,
}: {
  announcementId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setAnnouncementActive(announcementId, !isActive))}
      className="text-neutral-400 transition-colors hover:text-neutral-50 disabled:opacity-60"
    >
      {isActive ? "Ocultar da TV" : "Mostrar na TV"}
    </button>
  );
}
