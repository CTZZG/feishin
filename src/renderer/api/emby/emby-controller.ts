import chunk from 'lodash/chunk';
import { z } from 'zod';

import { createAuthHeader, embyApiClient } from '/@/renderer/api/emby/emby-api';
import { getServerUrl } from '/@/renderer/utils/normalize-server-url';
import { EmbySongListSort, EmbySortOrder } from '/@/shared/api/emby.types';
import { embyNormalize } from '/@/shared/api/emby/emby-normalize';
import { embyType } from '/@/shared/api/emby/emby-types';
import { getFeatures, VersionInfo } from '/@/shared/api/utils';
import {
    Album,
    albumArtistListSortMap,
    AlbumListArgs,
    AlbumListResponse,
    AlbumListSort,
    albumListSortMap,
    genreListSortMap,
    ImageArgs,
    ImageRequest,
    InternalControllerEndpoint,
    LibraryItem,
    playlistListSortMap,
    ReplaceApiClientProps,
    ServerType,
    Song,
    songListSortMap,
    sortOrderMap,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

const formatCommaDelimitedString = (value: string[]) => {
    return value.join(',');
};

const MAX_ITEMS_PER_PLAYLIST_ADD = 50;
const TICKS_PER_MILLISECOND = 10000;
const TICKS_PER_SECOND = TICKS_PER_MILLISECOND * 1000;

let musicLibraryId: string | undefined;

const VERSION_INFO: VersionInfo = [
    [
        '4.8.0',
        {
            [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [1],
            [ServerFeature.TAGS]: [1],
        },
    ],
];

const getPlaybackPositionTicks = (
    position: number | undefined,
    unit: 'milliseconds' | 'seconds',
) => {
    if (!position) {
        return 0;
    }

    return Math.round(
        position * (unit === 'milliseconds' ? TICKS_PER_MILLISECOND : TICKS_PER_SECOND),
    );
};

const getEmbyImageRequest = ({
    apiClientProps: { server },
    baseUrl,
    query,
}: ReplaceApiClientProps<ImageArgs>): ImageRequest | null => {
    const { id, size } = query;

    if (!server) {
        return null;
    }

    const url = baseUrl || getServerUrl(server);

    if (!url) {
        return null;
    }

    return {
        cacheKey: ['emby', server.id, baseUrl || '', id, size || ''].join(':'),
        headers: { 'X-Emby-Authorization': createAuthHeader(server) },
        url:
            `${url}/Items/${id}/Images/Primary?quality=96` +
            (size ? `&width=${size}` : '') +
            (server.credential ? `&api_key=${encodeURIComponent(server.credential)}` : ''),
    };
};

type EmbyControllerEndpoint = InternalControllerEndpoint & {
    getRecentlyPlayedAlbums: (
        args: ReplaceApiClientProps<AlbumListArgs>,
    ) => Promise<AlbumListResponse>;
};

export const EmbyController: EmbyControllerEndpoint = {
    addToPlaylist: async (args) => {
        const { apiClientProps, body, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const chunks = chunk(body.songId, MAX_ITEMS_PER_PLAYLIST_ADD);

        for (const chunk of chunks) {
            const res = await embyApiClient(apiClientProps as any).addToPlaylist({
                body: null,
                params: {
                    id: query.id,
                },
                query: {
                    Ids: chunk.join(','),
                    UserId: apiClientProps.server?.userId,
                },
            });

            if (res.status !== 204) {
                throw new Error('Failed to add to playlist');
            }
        }

        return null;
    },
    authenticate: async (url, body) => {
        const cleanServerUrl = url.replace(/\/$/, '');

        const res = await embyApiClient({ server: null, url: cleanServerUrl } as any).authenticate({
            body: {
                Pw: body.password,
                Username: body.username,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to authenticate');
        }

        return {
            credential: res.body.AccessToken,
            id: res.body.ServerId,
            userId: res.body.User.Id,
            username: res.body.User.Name,
        };
    },
    createFavorite: async (args) => {
        const { apiClientProps, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        for (const id of query.id) {
            await embyApiClient(apiClientProps as any).createFavorite({
                body: {},
                params: {
                    id,
                    userId: apiClientProps.server?.userId,
                },
            });
        }

        return null;
    },
    createInternetRadioStation: async () => {
        throw new Error('Not supported');
    },
    createPlaylist: async (args) => {
        const { apiClientProps, body } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps as any).createPlaylist({
            body: {
                MediaType: 'Audio',
                Name: body.name,
                UserId: apiClientProps.server.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to create playlist');
        }

        return {
            id: res.body.Id,
        };
    },
    deleteFavorite: async (args) => {
        const { apiClientProps, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        for (const id of query.id) {
            await embyApiClient(apiClientProps as any).removeFavorite({
                body: {},
                params: {
                    id,
                    userId: apiClientProps.server?.userId,
                },
            });
        }

        return null;
    },
    deleteInternetRadioStation: async () => {
        throw new Error('Not supported');
    },
    deletePlaylist: async (args) => {
        const { apiClientProps, query } = args;

        const res = await embyApiClient(apiClientProps as any).deletePlaylist({
            params: {
                id: query.id,
            },
        });

        if (res.status !== 204) {
            throw new Error('Failed to delete playlist');
        }

        return null;
    },
    getAlbumArtistDetail: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps as any).getAlbumArtistDetail({
            params: {
                id: query.id,
                userId: apiClientProps.server?.userId,
            },
            query: {
                Fields: 'Genres,Overview',
                ImageTypeLimit: 1,
                ParentId: musicLibraryId,
            },
        });

        const similarArtistsRes = await embyApiClient(apiClientProps as any).getSimilarArtistList({
            params: {
                id: query.id,
            },
            query: {
                Limit: 10,
                ParentId: musicLibraryId,
                UserId: apiClientProps.server.userId,
            },
        });

        if (res.status !== 200 || similarArtistsRes.status !== 200) {
            throw new Error('Failed to get album artist detail');
        }

        return embyNormalize.albumArtist(
            { ...res.body, similarArtists: similarArtistsRes.body },
            apiClientProps.server as any,
        );
    },
    getAlbumArtistInfo: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        const similarArtistsRes = await embyApiClient(apiClientProps as any).getSimilarArtistList({
            params: {
                id: query.id,
            },
            query: {
                ImageTypeLimit: 1,
                Limit: query.limit ?? 10,
                ParentId: musicLibraryId,
                UserId: apiClientProps.server?.userId || undefined,
            },
        });

        if (similarArtistsRes.status !== 200) {
            return null;
        }

        return {
            biography: null,
            similarArtists:
                similarArtistsRes.body?.Items?.filter(
                    (entry) => entry.Name !== 'Various Artists',
                ).map((entry) => ({
                    id: entry.Id,
                    imageId: entry.ImageTags?.Primary
                        ? entry.Id
                        : entry.PrimaryImageTag
                          ? entry.PrimaryImageItemId || entry.Id
                          : null,
                    imageUrl: null,
                    name: entry.Name,
                    userFavorite: entry.UserData?.IsFavorite || false,
                    userRating: null,
                })) ?? null,
        };
    },
    getAlbumArtistList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        const res = await embyApiClient(apiClientProps as any).getAlbumArtistList({
            query: {
                Fields: 'DateCreated,Genres,Overview',
                ImageTypeLimit: 1,
                Limit: query.limit,
                ParentId: musicLibraryId,
                Recursive: true,
                SearchTerm: query.searchTerm,
                SortBy: albumArtistListSortMap.emby[query.sortBy] || 'SortName',
                SortOrder: sortOrderMap.emby[query.sortOrder],
                StartIndex: query.startIndex,
                UserId: apiClientProps.server?.userId || undefined,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album artist list');
        }

        return {
            items: res.body.Items.map((item) =>
                embyNormalize.albumArtist(item, apiClientProps.server!),
            ),
            startIndex: query.startIndex,
            totalRecordCount: res.body?.TotalRecordCount || res.body?.Items?.length,
        };
    },
    getAlbumArtistListCount: async ({ apiClientProps, query }) =>
        EmbyController.getAlbumArtistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getAlbumDetail: async (args) => {
        const { apiClientProps, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps as any).getAlbumDetail({
            params: {
                id: query.id,
                userId: apiClientProps.server.userId,
            },
            query: {
                Fields: 'Genres,DateCreated,ChildCount,MediaSources,Tags',
                ImageTypeLimit: 1,
            },
        });

        const songsRes = await embyApiClient(apiClientProps as any).getSongList({
            query: {
                Fields: 'Genres,DateCreated,MediaSources,ParentId,Tags',
                IncludeItemTypes: 'Audio',
                ParentId: query.id,
                SortBy: embyType._enum.songList.ALBUM_DETAIL,
                UserId: apiClientProps.server.userId,
            },
        });

        if (res.status !== 200 || songsRes.status !== 200) {
            throw new Error('Failed to get album detail');
        }

        const album = await embyNormalize.album(
            { ...res.body, Songs: songsRes.body.Items },
            apiClientProps.server as any,
            embyApiClient(apiClientProps as any),
            apiClientProps as any,
        );
        return album;
    },
    getAlbumList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        if (query.sortBy === AlbumListSort.RECENTLY_PLAYED) {
            return EmbyController.getRecentlyPlayedAlbums(args);
        }

        const res = await embyApiClient(apiClientProps as any).getAlbumList({
            query: {
                ArtistIds: query.artistIds
                    ? formatCommaDelimitedString(query.artistIds)
                    : undefined,
                Fields: 'ChildCount,DateCreated,MediaSources,ProductionYear,Genres,DatePlayed,Tags,Overview',
                GenreIds: query.genreIds ? query.genreIds.join(',') : undefined,
                ImageTypeLimit: 1,
                IncludeItemTypes: 'MusicAlbum',
                IsFavorite: query.favorite,
                Limit: query.limit,
                ParentId: musicLibraryId,
                Recursive: true,
                SearchTerm: query.searchTerm,
                SortBy: albumListSortMap.emby[query.sortBy] || 'SortName',
                SortOrder: sortOrderMap.emby[query.sortOrder],
                StartIndex: query.startIndex,
                UserId: apiClientProps.server?.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album list');
        }

        const items = await Promise.all(
            res.body.Items.map((item) =>
                embyNormalize.album(
                    item,
                    apiClientProps.server!,
                    embyApiClient(apiClientProps as any),
                    apiClientProps as any,
                ),
            ),
        );

        return {
            items,
            startIndex: query.startIndex,
            totalRecordCount: res.body?.TotalRecordCount || res.body?.Items?.length,
        };
    },
    getAlbumListCount: async ({ apiClientProps, query }) =>
        EmbyController.getAlbumList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getAlbumRadio: async (args) => {
        const { apiClientProps, query } = args;

        const res = await embyApiClient(apiClientProps as any).getInstantMix({
            params: {
                id: query.albumId,
            },
            query: {
                Fields: 'Genres,DateCreated,MediaSources,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                Limit: query.count,
                UserId: apiClientProps.server?.userId || '',
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album radio');
        }

        return res.body.Items.map((item) => embyNormalize.song(item, apiClientProps.server!, ''));
    },
    getArtistList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        const res = await embyApiClient(apiClientProps as any).getArtistList({
            query: {
                Fields: 'DateCreated,Genres',
                ImageTypeLimit: 1,
                Limit: query.limit,
                ParentId: musicLibraryId,
                Recursive: true,
                SearchTerm: query.searchTerm,
                SortBy: albumArtistListSortMap.emby[query.sortBy] || 'SortName',
                SortOrder: sortOrderMap.emby[query.sortOrder],
                StartIndex: query.startIndex,
                UserId: apiClientProps.server?.userId || undefined,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album artist list');
        }

        return {
            items: res.body.Items.map((item) =>
                embyNormalize.albumArtist(item, apiClientProps.server!),
            ),
            startIndex: query.startIndex,
            totalRecordCount: res.body?.TotalRecordCount || res.body?.Items?.length,
        };
    },
    getArtistListCount: async ({ apiClientProps, query }) =>
        EmbyController.getArtistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getArtistRadio: async (args) => {
        const { apiClientProps, query } = args;
        const { artistId, count } = query;

        const res = await embyApiClient(apiClientProps as any).getInstantMix({
            params: {
                id: artistId,
            },
            query: {
                Fields: 'Genres,DateCreated,MediaSources,UserData,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                Limit: count || 50,
                UserId: apiClientProps.server?.userId || '',
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get artist radio');
        }

        return res.body.Items.map((item) => embyNormalize.song(item, apiClientProps.server!, ''));
    },
    getDownloadUrl: (args) => {
        const { apiClientProps, query } = args;
        const serverUrl = getServerUrl(apiClientProps.server);

        if (!serverUrl || !apiClientProps.server?.credential) {
            throw new Error('No server credential found');
        }

        const params = new URLSearchParams({ api_key: apiClientProps.server.credential });

        return `${serverUrl}/Items/${query.id}/Download?${params.toString()}`;
    },
    getFolder: async ({ apiClientProps, query }) => {
        const userId = apiClientProps.server?.userId;
        if (!userId) throw new Error('No userId found');

        // Root folder
        if (query.id === '0') {
            const res = await EmbyController.getMusicFolderList({ apiClientProps });

            if (!res.items) {
                throw new Error('Failed to get music folder list');
            }

            const folders = res.items.map((item) => ({
                _itemType: LibraryItem.FOLDER,
                _serverId: apiClientProps.server?.id || '',
                _serverType: ServerType.EMBY,
                children: {
                    folders: [],
                    songs: [],
                },
                id: item.id,
                name: item.name,
            }));

            return {
                _itemType: LibraryItem.FOLDER,
                _serverId: apiClientProps.server?.id || '',
                _serverType: ServerType.EMBY,
                children: {
                    folders: folders as any[],
                    songs: [],
                },
                id: '0',
                name: 'Root',
            } as any;
        }

        // Sub-folder
        const res = await embyApiClient(apiClientProps as any).getSongList({
            query: {
                ParentId: query.id,
                UserId: userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get folder items');
        }

        const items = res.body.Items;
        const folders = items
            .filter((item) => item.Type === 'Folder' || item.Type === 'CollectionFolder')
            .map((item) => ({
                _itemType: LibraryItem.FOLDER,
                _serverId: apiClientProps.server?.id || '',
                _serverType: ServerType.EMBY,
                children: {
                    folders: [],
                    songs: [],
                },
                id: item.Id,
                name: item.Name,
            }));

        const songs = items
            .filter((item) => item.Type === 'Audio')
            .map((item) =>
                embyNormalize.song(
                    item,
                    apiClientProps.server as any,
                    apiClientProps.server?.id || '',
                ),
            );

        return {
            _itemType: LibraryItem.FOLDER,
            _serverId: apiClientProps.server?.id || '',
            _serverType: ServerType.EMBY,
            children: {
                folders: folders as any[],
                songs,
            },
            id: query.id,
            name: 'Folder',
        } as any;
    },
    getGenreList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps as any).getGenreList({
            query: {
                ImageTypeLimit: 1,
                ParentId: musicLibraryId,
                Recursive: true,
                SearchTerm: query?.searchTerm,
                SortBy: genreListSortMap.emby[query.sortBy] || 'SortName',
                SortOrder: sortOrderMap.emby[query.sortOrder],
                StartIndex: query.startIndex,
                UserId: apiClientProps.server?.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get genre list');
        }

        return {
            items: res.body.Items.map((item) => embyNormalize.genre(item, apiClientProps.server!)),
            startIndex: query.startIndex || 0,
            totalRecordCount: res.body?.TotalRecordCount || res.body?.Items?.length,
        };
    },
    getImageRequest: getEmbyImageRequest,
    getImageUrl: (args) => {
        return getEmbyImageRequest(args)?.url || null;
    },
    getInternetRadioStations: async () => {
        return [];
    },
    getLyrics: async (args) => {
        const { apiClientProps, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const songDetailRes = await embyApiClient(apiClientProps as any).getSongDetail({
            params: {
                id: query.songId,
                userId: apiClientProps.server.userId,
            },
            query: {
                Fields: 'MediaSources',
            },
        });

        const songData = songDetailRes.body;

        if (!songData) {
            return [];
        }

        const embySong = songData as unknown as z.infer<typeof embyType._response.song>;

        if (!embySong.MediaSources || embySong.MediaSources.length === 0) {
            return [];
        }

        // 支持两种歌词格式
        const lrcStream = embySong.MediaSources[0].MediaStreams?.find(
            (s) =>
                s.Type === 'Subtitle' &&
                (s.Codec === 'lrc' || (s.Codec === 'text' && (s as any).Title === 'Lyrics')),
        );

        if (!lrcStream) {
            return [];
        }

        const res = await embyApiClient(apiClientProps as any).getSongLyrics({
            params: {
                id: query.songId,
                index: lrcStream.Index.toString(),
                mediaSourceId: embySong.MediaSources[0].Id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get lyrics');
        }

        const lyricsData = res.body;
        const parsedLyrics = embyType._response.lyrics.parse(lyricsData);

        if (parsedLyrics.TrackEvents.length > 0) {
            return parsedLyrics.TrackEvents.map((lyric) => [
                lyric.StartPositionTicks / 10000,
                lyric.Text,
            ]);
        }

        return [] as [number, string][];
    },
    getMusicFolderList: async (args) => {
        const { apiClientProps } = args;
        const userId = apiClientProps.server?.userId;

        if (!userId) throw new Error('No userId found');

        if (musicLibraryId) {
            const cachedLibrary = embyNormalize.musicFolder({
                CollectionType: 'music',
                Id: musicLibraryId,
                IsFolder: true,
                Name: '音乐',
                ServerId: apiClientProps.server?.id || '',
                Type: 'CollectionFolder',
            });
            return {
                items: [cachedLibrary],
                startIndex: 0,
                totalRecordCount: 1,
            };
        }

        const res = await embyApiClient(apiClientProps as any).getMusicFolderList({
            params: {
                userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get music folder list');
        }

        const musicLibrary = res.body.Items.find((view) => view.CollectionType === 'music');

        if (!musicLibrary) {
            throw new Error('Could not find a music library');
        }

        musicLibraryId = musicLibrary.Id;

        return {
            items: [embyNormalize.musicFolder(musicLibrary)],
            startIndex: 0,
            totalRecordCount: 1,
        };
    },
    getPlaylistDetail: async (args) => {
        const { apiClientProps, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps as any).getPlaylistDetail({
            params: {
                id: query.id,
                userId: apiClientProps.server?.userId,
            },
            query: {
                ImageTypeLimit: 1,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist detail');
        }

        return embyNormalize.playlist(res.body, apiClientProps.server!);
    },
    getPlaylistList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps as any).getPlaylistList({
            query: {
                Fields: 'ChildCount,DateCreated',
                ImageTypeLimit: 1,
                IncludeItemTypes: 'Playlist',
                Limit: query.limit,
                ParentId: musicLibraryId,
                Recursive: true,
                SearchTerm: query.searchTerm,
                SortBy: playlistListSortMap.emby[query.sortBy],
                SortOrder: sortOrderMap.emby[query.sortOrder],
                StartIndex: query.startIndex,
                UserId: apiClientProps.server.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist list');
        }

        return {
            items: res.body.Items.map((item) =>
                embyNormalize.playlist(item, apiClientProps.server!),
            ),
            startIndex: 0,
            totalRecordCount: res.body?.TotalRecordCount || res.body?.Items?.length,
        };
    },
    getPlaylistListCount: async ({ apiClientProps, query }) =>
        EmbyController.getPlaylistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getPlaylistSongList: async (args) => {
        const { apiClientProps, query } = args;
        const playlistQuery = query as typeof query & {
            limit?: number;
            sortBy?: keyof typeof songListSortMap.emby;
            sortOrder?: keyof typeof sortOrderMap.emby;
            startIndex?: number;
        };

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient({
            ...apiClientProps,
            server: apiClientProps.server as any,
        }).getSongList({
            query: {
                Fields: 'Genres,DateCreated,MediaSources,UserData,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                IncludeItemTypes: 'Audio',
                Limit: playlistQuery.limit,
                ParentId: query.id,
                SortBy: playlistQuery.sortBy
                    ? songListSortMap.emby[playlistQuery.sortBy]
                    : undefined,
                SortOrder: playlistQuery.sortOrder
                    ? sortOrderMap.emby[playlistQuery.sortOrder]
                    : undefined,
                StartIndex: playlistQuery.startIndex,
                UserId: apiClientProps.server?.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist song list');
        }

        const items = res.body.Items.map((item) =>
            embyNormalize.song(item, apiClientProps.server!, ''),
        );

        return {
            items,
            startIndex: playlistQuery.startIndex ?? 0,
            totalRecordCount: res.body?.TotalRecordCount || res.body?.Items?.length,
        };
    },
    getPlayQueue: async () => {
        throw new Error('Not supported');
    },
    getRandomSongList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient({
            ...apiClientProps,
            server: apiClientProps.server as any,
        }).getSongList({
            query: {
                Fields: 'Genres,DateCreated,MediaSources,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                GenreIds: query.genre ? query.genre : undefined,
                IncludeItemTypes: 'Audio',
                Limit: query.limit,
                ParentId: musicLibraryId,
                Recursive: true,
                SortBy: EmbySongListSort.RANDOM,
                SortOrder: EmbySortOrder.ASC,
                StartIndex: 0,
                UserId: apiClientProps.server.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get random songs');
        }

        return {
            items: res.body.Items.map((item) =>
                embyNormalize.song(item, apiClientProps.server!, ''),
            ),
            startIndex: 0,
            totalRecordCount: res.body?.Items?.length || 0,
        };
    },
    getRecentlyPlayedAlbums: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        // 1. 查询最近播放的歌曲
        const songQuery = {
            limit: 100,
            sortBy: songListSortMap.emby.recentlyPlayed,
            sortOrder: sortOrderMap.emby.DESC,
            startIndex: 0,
        };

        const songsRes = await embyApiClient(apiClientProps as any).getSongList({
            query: {
                Fields: 'Genres,DateCreated,MediaSources,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                Filters: 'IsPlayed',
                IncludeItemTypes: 'Audio',
                Limit: songQuery.limit,
                ParentId: musicLibraryId,
                Recursive: true,
                SortBy: songQuery.sortBy,
                SortOrder: songQuery.sortOrder,
                StartIndex: songQuery.startIndex,
                UserId: apiClientProps.server.userId,
            },
        });

        if (songsRes.status !== 200) {
            throw new Error('Failed to get recently played songs');
        }

        const albumMap = new Map<string, { lastPlayed: string; song: any }>();

        for (const song of songsRes.body.Items) {
            if (song.AlbumId) {
                // AlbumId 是专辑ID
                const existing = albumMap.get(song.AlbumId);
                const songLastPlayed = song.DatePlayed || '';

                if (!existing || songLastPlayed > existing.lastPlayed) {
                    albumMap.set(song.AlbumId, {
                        lastPlayed: songLastPlayed,
                        song: song,
                    });
                }
            }
        }

        // 3. 按播放时间排序并获取专辑详情
        const sortedAlbums = Array.from(albumMap.values())
            .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
            .slice(0, query.limit || 15);

        const albumPromises = sortedAlbums.map(({ song }) =>
            EmbyController.getAlbumDetail({
                apiClientProps,
                query: { id: song.AlbumId },
            }),
        );

        const albums = await Promise.all(albumPromises);

        return {
            items: albums.filter((album): album is Album => album !== null),
            startIndex: query.startIndex || 0,
            totalRecordCount: albumMap.size,
        };
    },
    getRoles: async () => [],
    getServerInfo: async (args) => {
        const { apiClientProps } = args;

        const res = await embyApiClient(apiClientProps as any).getServerInfo();

        if (res.status !== 200) {
            throw new Error('Failed to get server info');
        }

        const defaultFeatures = {
            [ServerFeature.REPORT_PLAYBACK]: [1],
        };

        const features = {
            ...defaultFeatures,
            ...getFeatures(VERSION_INFO, res.body.Version),
        };

        return {
            features,
            id: apiClientProps.server?.id,
            version: res.body.Version,
        };
    },
    getSimilarSongs: async (args) => {
        const { apiClientProps, query } = args;

        const res = await embyApiClient(apiClientProps as any).getSimilarSongs({
            params: {
                id: query.songId,
            },
            query: {
                Fields: 'Genres,DateCreated,MediaSources,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                Limit: query.count,
                UserId: apiClientProps.server?.userId || undefined,
            },
        });

        if (res.status !== 200) {
            const mix = await embyApiClient(apiClientProps as any).getInstantMix({
                params: {
                    id: query.songId,
                },
                query: {
                    Fields: 'Genres,DateCreated,MediaSources,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                    Limit: query.count,
                    UserId: apiClientProps.server?.userId || undefined,
                },
            });

            if (mix.status !== 200) {
                throw new Error('Failed to get similar songs or instant mix');
            }

            return mix.body.Items.reduce<Song[]>((acc, song) => {
                if (song.Id !== query.songId) {
                    acc.push(embyNormalize.song(song, apiClientProps.server as any, ''));
                }
                return acc;
            }, []);
        }

        return res.body.Items.reduce<Song[]>((acc, song) => {
            if (song.Id !== query.songId) {
                acc.push(embyNormalize.song(song, apiClientProps.server as any, ''));
            }
            return acc;
        }, []);
    },
    getSongDetail: async (args) => {
        const { apiClientProps, query } = args;

        const res = await embyApiClient(apiClientProps as any).getSongDetail({
            params: {
                id: query.id,
                userId: apiClientProps.server?.userId ?? '',
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song detail');
        }

        return embyNormalize.song(res.body, apiClientProps.server as any, '');
    },
    getSongList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient({
            ...apiClientProps,
            server: apiClientProps.server as any,
        }).getSongList({
            query: {
                ArtistIds: query.artistIds
                    ? formatCommaDelimitedString(query.artistIds)
                    : undefined,
                Fields: 'Genres,DateCreated,MediaSources,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                GenreIds: query.genreIds?.join(','),
                IncludeItemTypes: 'Audio',
                IsFavorite: query.favorite,
                Limit: query.limit,
                ParentId: (query as any).parentId || musicLibraryId,
                Recursive: true,
                SearchTerm: query.searchTerm,
                SortBy: songListSortMap.emby[query.sortBy] || 'Album,SortName',
                SortOrder: sortOrderMap.emby[query.sortOrder],
                StartIndex: query.startIndex,
                UserId: apiClientProps.server.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song list');
        }

        const items = res.body.Items.map((item) =>
            embyNormalize.song(item, apiClientProps.server as any, '', query.imageSize),
        );

        return {
            items,
            startIndex: query.startIndex,
            totalRecordCount: res.body?.TotalRecordCount || res.body?.Items?.length,
        };
    },
    getSongListCount: async ({ apiClientProps, query }) =>
        EmbyController.getSongList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getStreamUrl: async ({ apiClientProps: { server }, query }) => {
        const { bitrate, format, id } = query;
        const serverUrl = getServerUrl(server);
        const deviceId = server?.id || '';

        if (!serverUrl || !server?.credential) {
            throw new Error('No server credential found');
        }

        const params = new URLSearchParams({
            api_key: server.credential,
            AudioCodec: format || 'aac',
            Container: 'opus,mp3,aac,m4a,m4b,flac,wav,ogg',
            DeviceId: deviceId,
            MaxStreamingBitrate: String(bitrate ? bitrate * 1000 : 140000000),
            TranscodingContainer: format || 'mp3',
            TranscodingProtocol: 'http',
            UserId: server.userId || '',
        });

        return `${serverUrl}/Audio/${id}/universal?${params.toString()}`;
    },
    getTagList: async (args) => {
        const { apiClientProps, query } = args;

        const res = await embyApiClient(apiClientProps as any).getFilterList({
            query: {
                IncludeItemTypes: query.type === LibraryItem.SONG ? 'Audio' : 'MusicAlbum',
                ParentId: query.folder,
                UserId: apiClientProps.server?.userId ?? '',
            },
        });

        if (res.status !== 200) {
            throw new Error('failed to get tags');
        }

        const tagOptions =
            res.body.Tags?.sort((a, b) => a.localeCompare(b)).map((tag) => ({
                id: tag,
                name: tag,
            })) ?? [];

        return {
            excluded: { album: [], song: [] },
            tags: tagOptions.length
                ? [
                      {
                          name: 'Tags',
                          options: tagOptions,
                      },
                  ]
                : [],
        };
    },
    getTopSongs: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient({
            ...apiClientProps,
            server: apiClientProps.server as any,
        }).getSongList({
            query: {
                ArtistIds: query.artistId,
                Fields: 'Genres,DateCreated,MediaSources,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                Filters: 'IsPlayed',
                IncludeItemTypes: 'Audio',
                Limit: query.limit,
                ParentId: musicLibraryId,
                Recursive: true,
                SortBy: 'PlayCount,SortName',
                SortOrder: 'Descending',
                UserId: apiClientProps.server?.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get top song list');
        }

        return {
            items: res.body.Items.map((item) =>
                embyNormalize.song(item, apiClientProps.server as any, ''),
            ),
            startIndex: 0,
            totalRecordCount: res.body?.TotalRecordCount || res.body?.Items?.length,
        };
    },
    getUserInfo: async (args) => {
        const { apiClientProps } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps as any).getUserInfo({
            params: {
                id: apiClientProps.server.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get user info');
        }

        return {
            createdAt: null,
            email: null,
            id: res.body.Id,
            isAdmin: res.body.Policy.IsAdministrator,
            lastLoginAt: res.body.LastLoginDate || null,
            name: res.body.Name,
            updatedAt: null,
        };
    },
    // getTranscodingUrl removed
    // getTranscodingUrl: (args) => {
    //     const { base, bitrate, format } = args.query;
    //     let url = base;
    //     if (format) {
    //         url += `&audioCodec=${format}`;
    //     }
    //     if (bitrate !== undefined) {
    //         url += `&audioBitRate=${bitrate * 1000}`;
    //     }
    //     return url;
    // },
    movePlaylistItem: async (args) => {
        const { apiClientProps, query } = args;

        const res = await embyApiClient(apiClientProps as any).movePlaylistItem({
            body: null,
            params: {
                itemId: query.trackId,
                newIndex: query.endingIndex.toString(),
                playlistId: query.playlistId,
            },
        });

        if (res.status !== 204) {
            throw new Error('Failed to move item in playlist');
        }
    },
    removeFromPlaylist: async (args) => {
        const { apiClientProps, query } = args;

        const chunks = chunk(query.songId, MAX_ITEMS_PER_PLAYLIST_ADD);

        for (const chunk of chunks) {
            const res = await embyApiClient(apiClientProps as any).removeFromPlaylist({
                params: {
                    id: query.id,
                },
                query: {
                    EntryIds: chunk.join(','),
                },
            });

            if (res.status !== 204) {
                throw new Error('Failed to remove from playlist');
            }
        }

        return null;
    },
    replacePlaylist: async () => {
        throw new Error('Not implemented');
    },
    savePlayQueue: async () => {
        throw new Error('Not supported');
    },
    scrobble: async (args) => {
        const { apiClientProps, query } = args;
        const playSessionId = apiClientProps.server?.id + '-' + query.id;

        if (!apiClientProps.server?.userId) {
            throw new Error('no user id');
        }

        if (query.submission) {
            const position = getPlaybackPositionTicks(query.position, 'milliseconds');

            // Send stopped scrobble for proper Last.fm integration
            await embyApiClient(apiClientProps as any).scrobbleStopped({
                body: {
                    ItemId: query.id,
                    PlaySessionId: playSessionId,
                    PositionTicks: position || 0,
                },
            });

            // Also mark as played in Emby
            await embyApiClient(apiClientProps as any).scrobbleMarkPlayed({
                params: {
                    id: query.id,
                    userId: apiClientProps.server.userId,
                },
                query: {},
            });
            return null;
        }

        const position = getPlaybackPositionTicks(query.position, 'seconds');

        if (query.event === 'start') {
            await embyApiClient(apiClientProps as any).scrobblePlaying({
                body: {
                    ItemId: query.id,
                    PlaySessionId: playSessionId,
                },
            });
            return null;
        }

        await embyApiClient(apiClientProps as any).scrobbleProgress({
            body: {
                EventName: query.event,
                IsPaused: query.event === 'pause',
                ItemId: query.id,
                PlaySessionId: playSessionId,
                PositionTicks: position || 0,
            },
        });

        return null;
    },
    search: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        let albums: z.infer<typeof embyType._response.albumList>['Items'] = [];
        let albumArtists: z.infer<typeof embyType._response.albumArtistList>['Items'] = [];
        let songs: z.infer<typeof embyType._response.songList>['Items'] = [];

        if (query.albumLimit) {
            const res = await embyApiClient(apiClientProps as any).getAlbumList({
                query: {
                    EnableTotalRecordCount: true,
                    Fields: 'ChildCount,DateCreated,MediaSources',
                    ImageTypeLimit: 1,
                    IncludeItemTypes: 'MusicAlbum',
                    Limit: query.albumLimit,
                    ParentId: musicLibraryId,
                    Recursive: true,
                    SearchTerm: query.query,
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    StartIndex: query.albumStartIndex || 0,
                    UserId: apiClientProps.server.userId,
                },
            });

            if (res.status === 200) {
                albums = res.body.Items;
            }
        }

        if (query.albumArtistLimit) {
            const res = await embyApiClient(apiClientProps as any).getAlbumArtistList({
                query: {
                    EnableTotalRecordCount: true,
                    Fields: 'DateCreated,Genres',
                    ImageTypeLimit: 1,
                    Limit: query.albumArtistLimit,
                    ParentId: musicLibraryId,
                    Recursive: true,
                    SearchTerm: query.query,
                    StartIndex: query.albumArtistStartIndex || 0,
                    UserId: apiClientProps.server?.userId,
                },
            });

            if (res.status === 200) {
                albumArtists = res.body.Items;
            }
        }

        if (query.songLimit) {
            const res = await embyApiClient({
                ...apiClientProps,
                server: apiClientProps.server as any,
            }).getSongList({
                query: {
                    EnableTotalRecordCount: true,
                    Fields: 'Genres,DateCreated,MediaSources,ParentId,Tags,DatePlayed,AlbumPrimaryImageTag',
                    IncludeItemTypes: 'Audio',
                    Limit: query.songLimit,
                    ParentId: musicLibraryId,
                    Recursive: true,
                    SearchTerm: query.query,
                    SortBy: 'Album,SortName',
                    SortOrder: 'Ascending',
                    StartIndex: query.songStartIndex || 0,
                    UserId: apiClientProps.server?.userId,
                },
            });

            if (res.status === 200) {
                songs = res.body.Items;
            }
        }

        return {
            albumArtists: albumArtists.map((item) =>
                embyNormalize.albumArtist(item, apiClientProps.server!),
            ),
            albums: await Promise.all(
                albums.map((item) =>
                    embyNormalize.album(
                        item,
                        apiClientProps.server!,
                        embyApiClient(apiClientProps as any),
                        apiClientProps as any,
                    ),
                ),
            ),
            songs: songs.map((item) => embyNormalize.song(item, apiClientProps.server!, '')),
        };
    },
    setPlaylistSongs: async () => {
        throw new Error('Not supported');
    },
    setRating: async (args) => {
        const { apiClientProps, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        // Handle rating deletion (rating = 0)
        if (query.rating === 0) {
            const res = await embyApiClient(apiClientProps as any).deleteRating({
                body: {},
                params: {
                    id: query.id[0],
                    userId: apiClientProps.server.userId,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to delete rating');
            }
        } else {
            // Handle rating setting (rating > 0)
            const res = await embyApiClient(apiClientProps as any).setRating({
                body: {
                    rating: query.rating,
                },
                params: {
                    id: query.id[0],
                    userId: apiClientProps.server.userId,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to set rating');
            }
        }

        return null;
    },
    updateInternetRadioStation: async () => {
        throw new Error('Not supported');
    },
    updatePlaylist: async (args) => {
        const { apiClientProps, body, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps as any).updatePlaylist({
            body: {
                Id: query.id,
                Name: body.name,
            },
            params: {
                id: query.id,
            },
        });

        if (res.status !== 204) {
            throw new Error('Failed to update playlist');
        }

        return null;
    },
};
