import { useSuspenseQuery } from '@tanstack/react-query';

import { artistsQueries } from '../api/artists-api';

import { useCurrentServerId } from '/@/renderer/store';
import { AlbumArtistListSort, SortOrder } from '/@/shared/types/domain-types';

export const useAlbumArtistList = (args?: {
    options?: { cacheTime?: number; staleTime?: number };
    query?: any;
    serverId?: string;
}) => {
    const defaultServerId = useCurrentServerId();
    const serverId = args?.serverId || defaultServerId;

    return useSuspenseQuery({
        ...artistsQueries.albumArtistList({
            options: {
                gcTime: args?.options?.cacheTime,
                staleTime: args?.options?.staleTime,
            },
            query: {
                sortBy: AlbumArtistListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
                ...args?.query,
            },
            serverId,
        }),
    });
};
