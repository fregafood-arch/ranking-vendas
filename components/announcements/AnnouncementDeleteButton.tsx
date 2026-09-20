"use client";

import { ConfirmButton } from "@/components/shared/ConfirmButton";
import { deleteAnnouncement } from "@/lib/actions/announcements.actions";

export function AnnouncementDeleteButton({ announcementId }: { announcementId: string }) {
  return (
    <ConfirmButton
      label="Excluir"
      confirmQuestion="Excluir este aviso? Ele some da TV imediatamente."
      confirmLabel="Excluir"
      onConfirm={() => deleteAnnouncement(announcementId)}
    />
  );
}
