import { queryKeys } from '/@/renderer/api/query-keys';
import { infiniteLoaderDataQueryKey } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import {
    DeletePlaylistArgs,
    LibraryItem,
    Playlist,
    PlaylistListResponse,
} from '/@/shared/types/domain-types';

export interface PreviousQueryData {
    data: unknown;
    queryKey: readonly unknown[];
}

export const applyDeletePlaylistOptimisticUpdates = (
    queryClient: any,
    variables: DeletePlaylistArgs,
): PreviousQueryData[] => {
    const previousQueries: PreviousQueryData[] = [];
    const playlistId = variables.query.id;

    // Update detail query - remove it
    const detailQueryKey = queryKeys.playlists.detail(
        variables.apiClientProps.serverId,
        playlistId,
    );

    const detailQueries = queryClient.getQueriesData({
        exact: false,
        queryKey: detailQueryKey,
    });

    if (detailQueries.length) {
        detailQueries.forEach(([queryKey, data]) => {
            if (data) {
                previousQueries.push({ data, queryKey });
                queryClient.setQueryData(queryKey, undefined);
            }
        });
    }

    // Update list queries - remove the playlist from items
    const listQueryKey = queryKeys.playlists.list(variables.apiClientProps.serverId);

    const listQueries = queryClient.getQueriesData({
        exact: false,
        queryKey: listQueryKey,
    });

    if (listQueries.length) {
        listQueries.forEach(([queryKey, data]) => {
            if (data) {
                previousQueries.push({ data, queryKey });
                queryClient.setQueryData(queryKey, (prev: PlaylistListResponse | undefined) => {
                    if (prev) {
                        return {
                            ...prev,
                            items: prev.items.filter((item: Playlist) => item.id !== playlistId),
                            totalRecordCount: Math.max(
                                0,
                                (prev.totalRecordCount || prev.items.length) - 1,
                            ),
                        };
                    }

                    return prev;
                });
            }
        });
    }

    // Update infinite loader queries - remove the playlist from data array
    const infiniteLoaderQueryKey = infiniteLoaderDataQueryKey(
        variables.apiClientProps.serverId,
        LibraryItem.PLAYLIST,
    );

    const infiniteLoaderQueries = queryClient.getQueriesData({
        exact: false,
        queryKey: infiniteLoaderQueryKey,
    });

    if (infiniteLoaderQueries.length) {
        infiniteLoaderQueries.forEach(([queryKey, data]) => {
            if (data) {
                previousQueries.push({ data, queryKey });
                queryClient.setQueryData(
                    queryKey,
                    (
                        prev:
                            | undefined
                            | {
                                  data: unknown[];
                                  pagesLoaded: Record<string, boolean>;
                              },
                    ) => {
                        if (prev && prev.data) {
                            return {
                                ...prev,
                                data: prev.data.filter((item: any) => {
                                    if (!item || !item.id) {
                                        return true;
                                    }

                                    return item.id !== playlistId;
                                }),
                            };
                        }

                        return prev;
                    },
                );
            }
        });
    }

    // Update songList query - remove it
    const songListQueryKey = queryKeys.playlists.songList(
        variables.apiClientProps.serverId,
        playlistId,
    );

    const songListQueries = queryClient.getQueriesData({
        exact: false,
        queryKey: songListQueryKey,
    });

    if (songListQueries.length) {
        songListQueries.forEach(([queryKey, data]) => {
            if (data) {
                previousQueries.push({ data, queryKey });
                queryClient.setQueryData(queryKey, undefined);
            }
        });
    }

    return previousQueries;
};

export const restorePlaylistQueryData = (
    queryClient: any,
    previousQueries: PreviousQueryData[],
): void => {
    previousQueries.forEach(({ data, queryKey }) => {
        queryClient.setQueryData(queryKey, data);
    });
};
