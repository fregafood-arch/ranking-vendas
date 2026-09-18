export function StagePlaceholder({
  title,
  stage,
}: {
  title: string;
  stage: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-semibold text-neutral-100">{title}</h1>
      <p className="text-sm text-neutral-400">Será implementado na {stage}.</p>
    </div>
  );
}
