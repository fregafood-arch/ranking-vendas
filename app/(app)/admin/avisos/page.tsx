import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import { AnnouncementActiveToggle } from "@/components/announcements/AnnouncementActiveToggle";
import { AnnouncementDeleteButton } from "@/components/announcements/AnnouncementDeleteButton";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-50">Avisos</h1>
        <p className="text-sm text-neutral-400">
          Painel de informações gerais para a equipe — aparece como um slide extra no Modo TV.
          Avisos ocultos ficam salvos aqui, mas não aparecem na TV.
        </p>
      </div>

      <AnnouncementForm />

      <div className="space-y-3">
        {announcements?.map((announcement) => (
          <div
            key={announcement.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-neutral-800 p-4"
          >
            <div className="min-w-0 space-y-1">
              {announcement.title && (
                <p className="font-medium text-neutral-50">{announcement.title}</p>
              )}
              <p className="text-sm break-words whitespace-pre-wrap text-neutral-300">
                {announcement.body}
              </p>
              <span
                className={
                  announcement.is_active
                    ? "inline-block rounded-full bg-emerald-900/50 px-2 py-0.5 text-xs text-emerald-300"
                    : "inline-block rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400"
                }
              >
                {announcement.is_active ? "Visível na TV" : "Oculto"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
              <AnnouncementActiveToggle announcementId={announcement.id} isActive={announcement.is_active} />
              <AnnouncementDeleteButton announcementId={announcement.id} />
            </div>
          </div>
        ))}
        {!announcements?.length && (
          <p className="text-sm text-neutral-500">Nenhum aviso cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
