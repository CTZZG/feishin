import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { AlbumListQuery, AlbumListSort, ServerType, SortOrder } from '/@/shared/types/domain-types';

export const useRecentlyPlayed = (args: QueryHookArgs<Partial<AlbumListQuery>>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    const requestQuery: AlbumListQuery = {
        limit: 5,
        sortBy: AlbumListSort.RECENTLY_PLAYED,
        sortOrder: SortOrder.ASC,
        startIndex: 0,
        ...query,
    };

    return useQuery({
        enabled: !!server?.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');

            // 对于 Emby 服务器，使用新的 getRecentlyPlayedAlbums 方法
            if (server.type === ServerType.EMBY && api.controller.getRecentlyPlayedAlbums) {
                return api.controller.getRecentlyPlayedAlbums({
                    apiClientProps: {
                        server,
                        signal,
                    },
                    query: requestQuery,
                });
            }

            // 对于其他服务器类型，使用原有的 getAlbumList 方法
            return api.controller.getAlbumList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: requestQuery,
            });
        },

        queryKey: queryKeys.albums.list(server?.id || '', requestQuery),
        ...options,
    });
};
