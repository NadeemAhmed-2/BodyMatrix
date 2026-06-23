import React from 'react';
import YoutubeIframe from 'react-native-youtube-iframe';

export default function YoutubePlayer({ videoId, height }) {
  return (
    <YoutubeIframe
      height={height || 200}
      videoId={videoId}
      play={false}
      webViewProps={{
        androidLayerType: 'hardware',
      }}
    />
  );
}
