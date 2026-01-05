import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { GridCarousel } from '/@/renderer/components/grid-carousel/grid-carousel-v2';
import { MemoizedItemCard } from '/@/renderer/components/item-card/item-card';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import { useGridRows } from '/@/renderer/components/item-list/helpers/use-grid-rows';
import { DefaultItemControlProps } from '/@/renderer/components/item-list/types';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useCurrentServerId } from '/@/renderer/store';
import {
    LibraryItem,
    Song,
    SongListQuery,
    SongListResponse,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ItemListKey, Play } from '/@/shared/types/types';

interface SongCarouselProps {
    enableRefresh?: boolean;
    excludeIds?: string[];
    query?: Partial<Omit<SongListQuery, 'startIndex'>>;
    rowCount?: number;
    sortBy: SongListSort;
    sortOrder: SortOrder;
    title: React.ReactNode | string;
}

const BaseSongInfiniteCarousel = (props: SongCarouselProps) => {
    const {
        enableRefresh,
        excludeIds,
        query: additionalQuery,
        rowCount = 1,
        sortBy,
        sortOrder,
        title,
    } = props;
    const rows = useGridRows(LibraryItem.SONG, ItemListKey.SONG);
    const {
        data: songs,
        fetchNextPage,
        hasNextPage,
        refetch,
    } = useSongListInfinite(sortBy, sortOrder, 20, additionalQuery);

    const player = usePlayer();
    const baseControls = useDefaultItemListControls();

    const controls = useMemo(() => {
        return {
            ...baseControls,
            onPlay: ({ item, playType }: DefaultItemControlProps & { playType: Play }) => {
                if (!item) {
                    return;
                }

                player.addToQueueByData([item as Song], playType);
            },
        };
    }, [baseControls, player]);

    const cards = useMemo(() => {
        // Flatten all pages and filter excluded IDs
        const allItems = songs.pages.flatMap((page: SongListResponse) => page.items);
        const filteredItems = excludeIds
            ? allItems.filter((song) => !excludeIds.includes(song.id))
            : allItems;

        return filteredItems.map((song: Song) => ({
            content: (
                <MemoizedItemCard
                    controls={controls}
                    data={song}
                    enableDrag
                    itemType={LibraryItem.SONG}
                    rows={rows}
                    type="poster"
                    withControls
                />
            ),
            id: song.id,
        }));
    }, [songs.pages, controls, excludeIds, rows]);

    const handleNextPage = useCallback(() => {}, []);

    const handlePrevPage = useCallback(() => {}, []);

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const firstPageItems = excludeIds
        ? songs.pages[0]?.items.filter((song) => !excludeIds.includes(song.id)) || []
        : songs.pages[0]?.items || [];

    if (firstPageItems.length === 0) {
        return null;
    }

    return (
        <GridCarousel
            cards={cards}
            enableRefresh={enableRefresh}
            hasNextPage={hasNextPage}
            loadNextPage={fetchNextPage}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onRefresh={handleRefresh}
            rowCount={rowCount}
            title={title}
        />
    );
};

export const SongInfiniteCarousel = (props: SongCarouselProps) => {
    return <BaseSongInfiniteCarousel {...props} />;
};

function useSongListInfinite(
    sortBy: SongListSort,
    sortOrder: SortOrder,
    itemLimit: number,
    additionalQuery?: Partial<Omit<SongListQuery, 'startIndex'>>,
) {
    const serverId = useCurrentServerId();

    const query = useSuspenseInfiniteQuery<SongListResponse>({
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.items.length < itemLimit) {
                return undefined;
            }

            const nextPageParam = Number(lastPageParam) + itemLimit;

            return String(nextPageParam);
        },
        initialPageParam: '0',
        queryFn: ({ pageParam, signal }) => {
            return api.controller.getSongList({
                apiClientProps: { serverId, signal },
                query: {
                    limit: itemLimit,
                    sortBy,
                    sortOrder,
                    startIndex: Number(pageParam),
                    ...additionalQuery,
                },
            });
        },
        queryKey: queryKeys.songs.infiniteList(serverId, {
            sortBy,
            sortOrder,
            ...additionalQuery,
        }),
    });

    return query;
}
