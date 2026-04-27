const parseEmbed = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) { const id = u.searchParams.get("v"); if (id) return `https://www.youtube.com/embed/${id}`; }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com")) { const id = u.pathname.split("/").filter(Boolean)[0]; if (id) return `https://player.vimeo.com/video/${id}`; }
  } catch {}
  return null;
};
export const VideoEmbed = ({ url, title }: { url: string; title?: string }) => {
  const src = parseEmbed(url);
  if (!src) return null;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl shadow-card bg-muted">
      <iframe src={src} title={title || "Video"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
    </div>
  );
};
