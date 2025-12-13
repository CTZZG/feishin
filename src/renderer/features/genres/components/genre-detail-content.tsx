import { Suspense, useMemo } from 'react';
import { useParams } from 'react-router';

import { AlbumListView } from '/@/renderer/features/albums/components/album-list-content';
import { SongListView } from '/@/renderer/features/songs/components/song-list-content';
import { GenreTarget, useGenreTarget, useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { ItemListKey } from '/@/shared/types/types';

export const GenreDetailContent = () => {
    const genreTarget = useGenreTarget();

    switch (genreTarget) {
        case GenreTarget.ALBUM:
            return <GenreDetailContentAlbums />;
        case GenreTarget.TRACK:
            return <GenreDetailContentSongs />;
        default:
            return null;
    }
};

function GenreDetailContentAlbums() {
    const { genreId } = useParams() as { genreId: string };
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ALBUM);

    const overrideQuery = useMemo(() => {
        return {
            genreIds: [genreId],
        };
    }, [genreId]);

    return (
        <Suspense fallback={<Spinner container />}>
            <AlbumListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                overrideQuery={overrideQuery}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
}

function GenreDetailContentSongs() {
    const { genreId } = useParams() as { genreId: string };
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.SONG);

    const overrideQuery = useMemo(() => {
        return {
            genreIds: [genreId],
        };
    }, [genreId]);

    return (
        <Suspense fallback={<Spinner container />}>
            <SongListView
                display={display}
                grid={grid}
                itemsPerPage={itemsPerPage}
                overrideQuery={overrideQuery}
                pagination={pagination}
                table={table}
            />
        </Suspense>
    );
}
