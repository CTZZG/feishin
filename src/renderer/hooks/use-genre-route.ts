import { useMemo } from 'react';
import { useLocation } from 'react-router';

import { AppRoute } from '/@/renderer/router/routes';

const ALBUM_REGEX = /albums$/;
const SONG_REGEX = /songs$/;

export const useGenreRoute = () => {
    const { pathname } = useLocation();
    const matchAlbum = ALBUM_REGEX.test(pathname);
    const matchSongs = SONG_REGEX.test(pathname);

    const baseState = AppRoute.LIBRARY_GENRES_DETAIL;

    return useMemo(() => {
        if (matchAlbum) {
            return AppRoute.LIBRARY_GENRES_DETAIL;
        }
        if (matchSongs) {
            return AppRoute.LIBRARY_GENRES_DETAIL;
        }
        return baseState;
    }, [baseState, matchAlbum, matchSongs]);
};
