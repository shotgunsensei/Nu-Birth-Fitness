import { memo } from "react";

interface YouTubeEmbedProps {
  videoId: string;
  playlistId?: string;
  autoPlay?: boolean;
}

function YouTubeEmbedComponent({ videoId, playlistId, autoPlay = false }: YouTubeEmbedProps) {
  let src = '';
  if (playlistId) {
    src = `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`;
  } else {
    src = `https://www.youtube-nocookie.com/embed/${videoId}`;
    if (autoPlay) {
      src += `?autoplay=1`;
    }
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={src}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full border-0"
      ></iframe>
    </div>
  );
}

export default memo(YouTubeEmbedComponent);
