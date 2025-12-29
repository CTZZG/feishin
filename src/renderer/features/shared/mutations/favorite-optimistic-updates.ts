import { queryKeys } from '/@/renderer/api/query-keys';
import { infiniteLoaderDataQueryKey } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import {
    Album,
    AlbumArtist,
    AlbumArtistDetailResponse,
    AlbumArtistListResponse,
    AlbumDetailResponse,
    AlbumListResponse,
    ArtistListResponse,
    FavoriteArgs,
    LibraryItem,
    PlaylistSongListResponse,
    Song,
    SongDetailResponse,
    TopSongListResponse,
} from '/@/shared/types/domain-types';

export interface PreviousQueryData {
    data: unknown;
    queryKey: readonly unknown[];
}

export const applyFavoriteOptimisticUpdates = (
    queryClient: any,
    variables: FavoriteArgs,
    isFavorite: boolean,
): PreviousQueryData[] => {
    const previousQueries: PreviousQueryData[] = [];
    const itemIdSet = new Set<string>();

    if (Array.isArray(variables.query.id)) {
        variables.query.id.forEach((id) => {
            itemIdSet.add(id);
        });
    } else {
        itemIdSet.add(variables.query.id);
    }

    switch (variables.query.type) {
        case LibraryItem.ALBUM: {
            const detailQueryKey = queryKeys.albums.detail(variables.apiClientProps.serverId);

            const detailQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: detailQueryKey,
            });

            if (detailQueries.length) {
                detailQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (prev: AlbumDetailResponse | undefined) => {
                                if (prev && itemIdSet.has(prev.id)) {
                                    return {
                                        ...prev,
                                        userFavorite: isFavorite,
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const listQueryKey = queryKeys.albums.list(variables.apiClientProps.serverId);

            const listQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: listQueryKey,
            });

            if (listQueries.length) {
                listQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (prev: AlbumListResponse | undefined) => {
                                if (prev) {
                                    return {
                                        ...prev,
                                        items: prev.items.map((item: Album) => {
                                            return itemIdSet.has(item.id)
                                                ? { ...item, userFavorite: isFavorite }
                                                : item;
                                        }),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const infiniteListQueryKey = queryKeys.albums.infiniteList(
                variables.apiClientProps.serverId,
            );

            const infiniteListQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: infiniteListQueryKey,
            });

            if (infiniteListQueries.length) {
                infiniteListQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (
                                prev:
                                    | undefined
                                    | { pageParams: string[]; pages: AlbumListResponse[] },
                            ) => {
                                if (prev) {
                                    return {
                                        ...prev,
                                        pages: prev.pages.map(
                                            (page: AlbumListResponse | undefined) => {
                                                if (page) {
                                                    return {
                                                        ...page,
                                                        items: page.items.map((item: Album) => {
                                                            return itemIdSet.has(item.id)
                                                                ? {
                                                                      ...item,
                                                                      userFavorite: isFavorite,
                                                                  }
                                                                : item;
                                                        }),
                                                    };
                                                }

                                                return page;
                                            },
                                        ),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const infiniteLoaderQueryKey = infiniteLoaderDataQueryKey(
                variables.apiClientProps.serverId,
                LibraryItem.ALBUM,
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
                                        data: prev.data.map((item: any) => {
                                            if (!item || !item.id) {
                                                return item;
                                            }

                                            return itemIdSet.has(item.id)
                                                ? { ...item, userFavorite: isFavorite }
                                                : item;
                                        }),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            break;
        }
        case LibraryItem.ALBUM_ARTIST: {
            const detailQueryKey = queryKeys.albumArtists.detail(variables.apiClientProps.serverId);

            const detailQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: detailQueryKey,
            });

            if (detailQueries.length) {
                detailQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (prev: AlbumArtistDetailResponse | undefined) => {
                                if (!prev) {
                                    return prev;
                                }

                                // Update the main artist if it matches
                                if (itemIdSet.has(prev.id)) {
                                    return {
                                        ...prev,
                                        userFavorite: isFavorite,
                                    };
                                }

                                // Update similar artists if any match
                                if (prev.similarArtists && prev.similarArtists.length > 0) {
                                    const hasMatchingSimilarArtist = prev.similarArtists.some(
                                        (artist) => itemIdSet.has(artist.id),
                                    );

                                    if (hasMatchingSimilarArtist) {
                                        return {
                                            ...prev,
                                            similarArtists: prev.similarArtists.map((artist) =>
                                                itemIdSet.has(artist.id)
                                                    ? { ...artist, userFavorite: isFavorite }
                                                    : artist,
                                            ),
                                        };
                                    }
                                }

                                return prev;
                            },
                        );
                    }
                });
            }
            const listQueryKey = queryKeys.albumArtists.list(variables.apiClientProps.serverId);

            const listQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: listQueryKey,
            });

            if (listQueries.length) {
                listQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (prev: AlbumArtistListResponse | undefined) => {
                                if (prev) {
                                    return {
                                        ...prev,
                                        items: prev.items.map((item: AlbumArtist | undefined) => {
                                            if (item) {
                                                return itemIdSet.has(item.id)
                                                    ? { ...item, userFavorite: isFavorite }
                                                    : item;
                                            }

                                            return item;
                                        }),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const infiniteListQueryKey = queryKeys.albumArtists.infiniteList(
                variables.apiClientProps.serverId,
            );

            const infiniteListQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: infiniteListQueryKey,
            });

            if (infiniteListQueries.length) {
                infiniteListQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (
                                prev:
                                    | undefined
                                    | { pageParams: string[]; pages: AlbumArtistListResponse[] },
                            ) => {
                                if (prev) {
                                    return {
                                        ...prev,
                                        pages: prev.pages.map(
                                            (page: AlbumArtistListResponse | undefined) => {
                                                if (page) {
                                                    return {
                                                        ...page,
                                                        items: page.items.map(
                                                            (item: AlbumArtist) => {
                                                                return itemIdSet.has(item.id)
                                                                    ? {
                                                                          ...item,
                                                                          userFavorite: isFavorite,
                                                                      }
                                                                    : item;
                                                            },
                                                        ),
                                                    };
                                                }

                                                return page;
                                            },
                                        ),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const infiniteLoaderQueryKey = infiniteLoaderDataQueryKey(
                variables.apiClientProps.serverId,
                LibraryItem.ALBUM_ARTIST,
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
                                        data: prev.data.map((item: any) => {
                                            if (!item || !item.id) {
                                                return item;
                                            }

                                            return itemIdSet.has(item.id)
                                                ? { ...item, userFavorite: isFavorite }
                                                : item;
                                        }),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            break;
        }
        case LibraryItem.ARTIST: {
            const listQueryKey = queryKeys.artists.list(variables.apiClientProps.serverId);

            const listQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: listQueryKey,
            });

            if (listQueries.length) {
                listQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (prev: ArtistListResponse | undefined) => {
                                if (prev) {
                                    return {
                                        ...prev,
                                        items: prev.items.map((item: AlbumArtist) => {
                                            return itemIdSet.has(item.id)
                                                ? { ...item, userFavorite: isFavorite }
                                                : item;
                                        }),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const infiniteListQueryKey = queryKeys.artists.infiniteList(
                variables.apiClientProps.serverId,
            );

            const infiniteListQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: infiniteListQueryKey,
            });

            if (infiniteListQueries.length) {
                infiniteListQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (
                                prev:
                                    | undefined
                                    | { pageParams: string[]; pages: ArtistListResponse[] },
                            ) => {
                                if (prev) {
                                    return {
                                        ...prev,
                                        pages: prev.pages.map((page: ArtistListResponse) => {
                                            return {
                                                ...page,
                                                items: page.items.map((item: AlbumArtist) => {
                                                    return itemIdSet.has(item.id)
                                                        ? { ...item, userFavorite: isFavorite }
                                                        : item;
                                                }),
                                            };
                                        }),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const infiniteLoaderQueryKey = infiniteLoaderDataQueryKey(
                variables.apiClientProps.serverId,
                LibraryItem.ARTIST,
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
                                        data: prev.data.map((item: any) => {
                                            if (!item || !item.id) {
                                                return item;
                                            }

                                            return itemIdSet.has(item.id)
                                                ? { ...item, userFavorite: isFavorite }
                                                : item;
                                        }),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            break;
        }
        case LibraryItem.PLAYLIST_SONG:
        case LibraryItem.QUEUE_SONG:
        case LibraryItem.SONG: {
            const albumDetailQueryKey = queryKeys.albums.detail(variables.apiClientProps.serverId);

            const albumDetailQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: albumDetailQueryKey,
            });

            if (albumDetailQueries.length) {
                albumDetailQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (prev: AlbumDetailResponse | undefined) => {
                                if (prev) {
                                    return {
                                        ...prev,
                                        songs: prev.songs?.map((song: Song) => {
                                            return itemIdSet.has(song.id)
                                                ? { ...song, userFavorite: isFavorite }
                                                : song;
                                        }),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const detailQueryKey = queryKeys.songs.detail(variables.apiClientProps.serverId);

            const detailQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: detailQueryKey,
            });

            if (detailQueries.length) {
                detailQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (prev: SongDetailResponse | undefined) => {
                                if (prev && itemIdSet.has(prev.id)) {
                                    return {
                                        ...prev,
                                        userFavorite: isFavorite,
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const playlistSongListQueryKey = queryKeys.playlists.songList(
                variables.apiClientProps.serverId,
            );

            const playlistSongListQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: playlistSongListQueryKey,
            });

            if (playlistSongListQueries.length) {
                playlistSongListQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (prev: PlaylistSongListResponse | undefined) => {
                                if (prev) {
                                    return {
                                        ...prev,
                                        items: prev.items.map((item: Song) =>
                                            itemIdSet.has(item.id)
                                                ? { ...item, userFavorite: isFavorite }
                                                : item,
                                        ),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            const topSongsQueryKey = queryKeys.albumArtists.topSongs(
                variables.apiClientProps.serverId,
            );

            const topSongsQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: topSongsQueryKey,
            });

            if (topSongsQueries.length) {
                topSongsQueries.forEach(([queryKey, data]) => {
                    if (data) {
                        previousQueries.push({ data, queryKey });
                        queryClient.setQueryData(
                            queryKey,
                            (prev: TopSongListResponse | undefined) => {
                                if (prev) {
                                    return {
                                        ...prev,
                                        items: prev.items.map((item: Song) =>
                                            itemIdSet.has(item.id)
                                                ? { ...item, userFavorite: isFavorite }
                                                : item,
                                        ),
                                    };
                                }

                                return prev;
                            },
                        );
                    }
                });
            }

            break;
        }
    }

    return previousQueries;
};
export const restoreFavoriteQueryData = (
    queryClient: any,
    previousQueries: PreviousQueryData[],
): void => {
    previousQueries.forEach(({ data, queryKey }) => {
        queryClient.setQueryData(queryKey, data);
    });
};
