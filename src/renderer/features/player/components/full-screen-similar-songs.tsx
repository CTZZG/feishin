import { SimilarSongsList } from '/@/renderer/features/similar-songs/components/similar-songs-list';
import { usePlayerSong } from '/@/renderer/store';

export const FullScreenSimilarSongs = () => {
    const currentSong = usePlayerSong();

    return currentSong?.id ? <SimilarSongsList fullScreen song={currentSong} /> : null;
};
