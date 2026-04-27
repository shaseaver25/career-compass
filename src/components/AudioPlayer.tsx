export const AudioPlayer = ({ src }: { src: string }) => (
  <div className="rounded-xl border border-border bg-surface p-3">
    <audio controls preload="metadata" src={src} className="w-full" />
  </div>
);
