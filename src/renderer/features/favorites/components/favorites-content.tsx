import { useQuery } from '@tanstack/react-query';
import { Suspense, useEffect } from 'react';

import { useListContext } from '/@/renderer/context/list-context';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import {
    AlbumListView,
    OverrideAlbumListQuery,
} from '/@/renderer/features/albums/components/album-list-content';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import {
    AlbumArtistListView,
    OverrideAlbumArtistListQuery,
} from '/@/renderer/features/artists/components/album-artist-list-content';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import {
    OverrideSongListQuery,
    SongListView,
} from '/@/renderer/features/songs/components/song-list-content';
import { useCurrentServer } from '/@/renderer/store';
import { useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface FavoritesContentProps {
    itemType: LibraryItem;
}

export const FavoritesContent = ({ itemType }: FavoritesContentProps) => {
    return (
        <AnimatedPage>
            <Suspense fallback={<Spinner container />}>
                {itemType === LibraryItem.ALBUM && <AlbumFavorites />}
                {itemType === LibraryItem.SONG && <SongFavorites />}
                {itemType === LibraryItem.ALBUM_ARTIST && <ArtistFavorites />}
            </Suspense>
        </AnimatedPage>
    );
};

const AlbumFavorites = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ALBUM);
    const { customFilters, setItemCount } = useListContext();
    const server = useCurrentServer();

    const albumQuery: OverrideAlbumListQuery = {
        ...(customFilters as OverrideAlbumListQuery),
    };

    const { data: count } = useQuery(
        albumQueries.listCount({
            query: albumQuery as any,
            serverId: server.id,
        }),
    );

    useEffect(() => {
        if (count !== undefined && setItemCount) {
            setItemCount(count);
        }
    }, [count, setItemCount]);

    return (
        <AlbumListView
            display={display}
            grid={grid}
            itemsPerPage={itemsPerPage}
            overrideQuery={albumQuery}
            pagination={pagination}
            table={table}
        />
    );
};

const SongFavorites = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.SONG);
    const { customFilters, setItemCount } = useListContext();
    const server = useCurrentServer();

    const songQuery: OverrideSongListQuery = {
        ...(customFilters as OverrideSongListQuery),
    };

    const { data: count } = useQuery(
        songsQueries.listCount({
            query: songQuery as any,
            serverId: server.id,
        }),
    );

    useEffect(() => {
        if (count !== undefined && setItemCount) {
            setItemCount(count);
        }
    }, [count, setItemCount]);

    return (
        <SongListView
            display={display}
            grid={grid}
            itemsPerPage={itemsPerPage}
            overrideQuery={songQuery}
            pagination={pagination}
            table={table}
        />
    );
};

const ArtistFavorites = () => {
    const { display, grid, itemsPerPage, pagination, table } = useListSettings(ItemListKey.ARTIST);
    const { customFilters, setItemCount } = useListContext();
    const server = useCurrentServer();

    const albumArtistQuery: OverrideAlbumArtistListQuery = {
        ...(customFilters as OverrideAlbumArtistListQuery),
    };

    const { data: count } = useQuery(
        artistsQueries.albumArtistListCount({
            query: albumArtistQuery as any,
            serverId: server.id,
        }),
    );

    useEffect(() => {
        if (count !== undefined && setItemCount) {
            setItemCount(count);
        }
    }, [count, setItemCount]);

    return (
        <AlbumArtistListView
            display={display}
            grid={grid}
            itemsPerPage={itemsPerPage}
            overrideQuery={albumArtistQuery}
            pagination={pagination}
            table={table}
        />
    );
};
