import { QueryFunctionContext, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { SingleFeatureCarousel } from '/@/renderer/components/feature-carousel/single-feature-carousel';
import { useCurrentServerId } from '/@/renderer/store';
import { Album, AlbumListResponse, AlbumListSort, SortOrder } from '/@/shared/types/domain-types';

interface InfiniteAlbumSingleFeatureCarouselProps {
    itemLimit?: number;
    queryKey?: QueryFunctionContext['queryKey'];
}

export const AlbumInfiniteSingleFeatureCarousel = ({
    itemLimit = 20,
    queryKey,
}: InfiniteAlbumSingleFeatureCarouselProps) => {
    const serverId = useCurrentServerId();
    const loadMoreTriggeredRef = useRef(false);

    const defaultQueryKey = queryKeys.albums.infiniteList(serverId, {
        sortBy: AlbumListSort.RANDOM,
        sortOrder: SortOrder.DESC,
    });

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useSuspenseInfiniteQuery<AlbumListResponse>({
            getNextPageParam: (lastPage, _allPages, lastPageParam) => {
                if (lastPage.items.length < itemLimit) {
                    return undefined;
                }

                const nextPageParam = Number(lastPageParam) + itemLimit;

                return String(nextPageParam);
            },
            initialPageParam: '0',
            queryFn: ({ pageParam, signal }) => {
                return api.controller.getAlbumList({
                    apiClientProps: { serverId, signal },
                    query: {
                        limit: itemLimit,
                        sortBy: AlbumListSort.RANDOM,
                        sortOrder: SortOrder.DESC,
                        startIndex: Number(pageParam),
                    },
                });
            },
            queryKey: queryKey || defaultQueryKey,
        });

    // Flatten all pages and filter for albums with images
    const albumsWithImages = useMemo(() => {
        const allAlbums = data.pages.flatMap((page: AlbumListResponse) => page.items);
        // Filter for albums with images and remove duplicates by ID
        const uniqueAlbums = new Map<string, Album>();
        for (const album of allAlbums) {
            if ((album.imageId || album.imageUrl) && !uniqueAlbums.has(album.id)) {
                uniqueAlbums.set(album.id, album);
            }
        }
        return Array.from(uniqueAlbums.values());
    }, [data.pages]);

    const handleNearEnd = () => {
        if (hasNextPage && !isFetchingNextPage && !loadMoreTriggeredRef.current) {
            loadMoreTriggeredRef.current = true;
            fetchNextPage().finally(() => {
                loadMoreTriggeredRef.current = false;
            });
        }
    };

    useEffect(() => {
        if (
            albumsWithImages.length < itemLimit * 2 &&
            hasNextPage &&
            !isFetchingNextPage &&
            !loadMoreTriggeredRef.current
        ) {
            loadMoreTriggeredRef.current = true;
            fetchNextPage().finally(() => {
                loadMoreTriggeredRef.current = false;
            });
        }
    }, [albumsWithImages.length, hasNextPage, isFetchingNextPage, fetchNextPage, itemLimit]);

    if (albumsWithImages.length === 0) {
        return null;
    }

    return <SingleFeatureCarousel data={albumsWithImages} onNearEnd={handleNearEnd} />;
};
