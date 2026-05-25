import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';

export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={600}
    fps={24}
    width={1280}
    height={720}
  />
);
