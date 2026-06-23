import React from 'react';

export default function YoutubePlayer({ videoId, style }) {
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
      style={style}
      frameBorder="0"
      allowFullScreen
    />
  );
}
