import chunk from 'lodash/chunk';
import { z } from 'zod';

import { embyApiClient } from '/@/renderer/api/emby/emby-api';
import { EmbySongListSort, EmbySortOrder } from '/@/shared/api/emby.types';
import { embyNormalize } from '/@/shared/api/emby/emby-normalize';
import { embyType } from '/@/shared/api/emby/emby-types';
import { getFeatures, VersionInfo } from '/@/shared/api/utils';
import {
    albumArtistListSortMap,
    AlbumListSort,
    albumListSortMap,
    ControllerEndpoint,
    genreListSortMap,
    playlistListSortMap,
    Song,
    SongListSort,
    songListSortMap,
    SortOrder,
    sortOrderMap,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

const formatCommaDelimitedString = (value: string[]) => {
    return value.join(',');
};

const MAX_ITEMS_PER_PLAYLIST_ADD = 50;

let musicLibraryId: string | undefined;

const VERSION_INFO: VersionInfo = [['4.8.0', { [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [1] }]];

export const EmbyController: ControllerEndpoint = {
    addToPlaylist: async (args) => {
        const { apiClientProps, body, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const chunks = chunk(body.songId, MAX_ITEMS_PER_PLAYLIST_ADD);

        for (const chunk of chunks) {
            const res = await embyApiClient(apiClientProps).addToPlaylist({
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

        const res = await embyApiClient({ server: null, url: cleanServerUrl }).authenticate({
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
            await embyApiClient(apiClientProps).createFavorite({
                body: {},
                params: {
                    id,
                    userId: apiClientProps.server?.userId,
                },
            });
        }

        return null;
    },
    createPlaylist: async (args) => {
        const { apiClientProps, body } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps).createPlaylist({
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
            await embyApiClient(apiClientProps).removeFavorite({
                body: {},
                params: {
                    id,
                    userId: apiClientProps.server?.userId,
                },
            });
        }

        return null;
    },
    deletePlaylist: async (args) => {
        const { apiClientProps, query } = args;

        const res = await embyApiClient(apiClientProps).deletePlaylist({
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

        const res = await embyApiClient(apiClientProps).getAlbumArtistDetail({
            params: {
                id: query.id,
                userId: apiClientProps.server?.userId,
            },
            query: {
                Fields: 'Genres,Overview',
                ParentId: musicLibraryId,
            },
        });

        const similarArtistsRes = await embyApiClient(apiClientProps).getSimilarArtistList({
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
            apiClientProps.server,
        );
    },
    getAlbumArtistList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        const res = await embyApiClient(apiClientProps).getAlbumArtistList({
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
                embyNormalize.albumArtist(item, apiClientProps.server),
            ),
            startIndex: query.startIndex,
            totalRecordCount: res.body.TotalRecordCount,
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

        const res = await embyApiClient(apiClientProps).getAlbumDetail({
            params: {
                id: query.id,
                userId: apiClientProps.server.userId,
            },
            query: {
                Fields: 'Genres,DateCreated,ChildCount,MediaSources',
            },
        });

        const songsRes = await embyApiClient(apiClientProps).getSongList({
            query: {
                Fields: 'Genres,DateCreated,MediaSources,ParentId',
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
            apiClientProps.server,
            embyApiClient(apiClientProps),
            apiClientProps,
        );
        return album;
    },
    getAlbumList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        if (query.sortBy === AlbumListSort.RANDOM) {
            const songList = await EmbyController.getSongList({
                apiClientProps,
                query: {
                    limit: 50, // Fetch more songs to ensure album diversity
                    sortBy: SongListSort.RANDOM,
                    sortOrder: SortOrder.ASC,
                    startIndex: 0,
                },
            });

            if (!songList?.items) {
                return { items: [], startIndex: 0, totalRecordCount: 0 };
            }

            const albumMap = new Map();
            for (const song of songList.items) {
                if (song.albumId && !albumMap.has(song.albumId)) {
                    albumMap.set(song.albumId, song);
                }
            }

            const uniqueAlbumSongs = Array.from(albumMap.values()).slice(0, query.limit);

            const albumDetailsPromises = uniqueAlbumSongs.map((song) =>
                EmbyController.getAlbumDetail({
                    apiClientProps,
                    query: { id: song.albumId },
                }),
            );

            const albums = (await Promise.all(albumDetailsPromises)).filter(
                (album) => album !== null,
            );

            return {
                items: albums,
                startIndex: 0,
                totalRecordCount: albums.length,
            };
        }

        const res = await embyApiClient(apiClientProps).getAlbumList({
            query: {
                ArtistIds: query.artistIds
                    ? formatCommaDelimitedString(query.artistIds)
                    : undefined,
                Fields: 'ChildCount,DateCreated,MediaSources',
                GenreIds: query.genres ? query.genres.join(',') : undefined,
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
                    apiClientProps.server,
                    embyApiClient(apiClientProps),
                    apiClientProps,
                ),
            ),
        );

        return {
            items,
            startIndex: query.startIndex,
            totalRecordCount: res.body.TotalRecordCount,
        };
    },
    getAlbumListCount: async ({ apiClientProps, query }) =>
        EmbyController.getAlbumList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getArtistList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        const res = await embyApiClient(apiClientProps).getArtistList({
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
                embyNormalize.albumArtist(item, apiClientProps.server),
            ),
            startIndex: query.startIndex,
            totalRecordCount: res.body.TotalRecordCount,
        };
    },
    getArtistListCount: async ({ apiClientProps, query }) =>
        EmbyController.getArtistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getDownloadUrl: (args) => {
        const { apiClientProps, query } = args;

        return `${apiClientProps.server?.url}/items/${query.id}/download?api_key=${apiClientProps.server?.credential}`;
    },
    getGenreList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps).getGenreList({
            query: {
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
            items: res.body.Items.map((item) => embyNormalize.genre(item, apiClientProps.server)),
            startIndex: query.startIndex || 0,
            totalRecordCount: res.body?.TotalRecordCount || 0,
        };
    },
    getLyrics: async (args) => {
        const { apiClientProps, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const songData = await EmbyController.getSongDetail({
            apiClientProps,
            query: { id: query.songId },
        });

        if (!songData) {
            return null;
        }

        const embySong = songData as unknown as z.infer<typeof embyType._response.song>;

        if (!embySong.MediaSources || embySong.MediaSources.length === 0) {
            return null;
        }

        const lrcStream = embySong.MediaSources[0].MediaStreams?.find(
            (s) => s.Type === 'Subtitle' && s.Codec === 'lrc',
        );

        if (!lrcStream) {
            return null;
        }

        const res = await embyApiClient(apiClientProps).getSongLyrics({
            params: {
                id: query.songId,
                index: lrcStream.Index.toString(),
                mediaSourceId: embySong.MediaSources[0].Id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get lyrics');
        }

        // Emby returns lyrics in a JS file, not pure JSON
        const jsonpData = res.body as unknown as string;
        const jsonString = jsonpData.substring(
            jsonpData.indexOf('{'),
            jsonpData.lastIndexOf('}') + 1,
        );
        const lyricsData = JSON.parse(jsonString);
        const parsedLyrics = embyType._response.lyrics.parse(lyricsData);

        if (parsedLyrics.TrackEvents.length > 0) {
            return parsedLyrics.TrackEvents.map((lyric) => [
                lyric.StartPositionTicks / 10000,
                lyric.Text,
            ]);
        }

        return null;
    },
    getMusicFolderList: async (args) => {
        const { apiClientProps } = args;
        const userId = apiClientProps.server?.userId;

        if (!userId) throw new Error('No userId found');

        if (musicLibraryId) {
            const cachedLibrary = embyNormalize.musicFolder({
                CollectionType: 'music',
                Id: musicLibraryId,
                Name: '音乐',
            });
            return {
                items: [cachedLibrary],
                startIndex: 0,
                totalRecordCount: 1,
            };
        }

        const res = await embyApiClient(apiClientProps).getMusicFolderList({
            params: {
                userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get music folder list');
        }

        const musicLibrary = res.body.Items.find(
            (view) => view.CollectionType === 'music' && view.Name === '音乐',
        );

        if (!musicLibrary) {
            throw new Error('Could not find a music library named "音乐"');
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

        const res = await embyApiClient(apiClientProps).getPlaylistDetail({
            params: {
                id: query.id,
                userId: apiClientProps.server?.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist detail');
        }

        return embyNormalize.playlist(res.body, apiClientProps.server);
    },
    getPlaylistList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps).getPlaylistList({
            query: {
                Fields: 'ChildCount,DateCreated',
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
                embyNormalize.playlist(item, apiClientProps.server),
            ),
            startIndex: 0,
            totalRecordCount: res.body.TotalRecordCount,
        };
    },
    getPlaylistListCount: async ({ apiClientProps, query }) =>
        EmbyController.getPlaylistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getPlaylistSongList: async (args) => {
        const { apiClientProps, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps).getPlaylistSongList({
            params: {
                id: query.id,
            },
            query: {
                Fields: 'Genres,DateCreated,MediaSources,UserData,ParentId',
                IncludeItemTypes: 'Audio',
                Limit: query.limit,
                SortBy: query.sortBy ? songListSortMap.emby[query.sortBy] : undefined,
                SortOrder: query.sortOrder ? sortOrderMap.emby[query.sortOrder] : undefined,
                StartIndex: query.startIndex,
                UserId: apiClientProps.server?.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist song list');
        }

        return {
            items: res.body.Items.map((item) =>
                embyNormalize.song(item, apiClientProps.server, ''),
            ),
            startIndex: query.startIndex,
            totalRecordCount: res.body.TotalRecordCount,
        };
    },
    getRandomSongList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps).getSongList({
            query: {
                Fields: 'Genres,DateCreated,MediaSources,ParentId',
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
                embyNormalize.song(item, apiClientProps.server, ''),
            ),
            startIndex: 0,
            totalRecordCount: res.body.Items.length || 0,
        };
    },
    getRoles: async () => [],
    getServerInfo: async (args) => {
        const { apiClientProps } = args;

        const res = await embyApiClient(apiClientProps).getServerInfo();

        if (res.status !== 200) {
            throw new Error('Failed to get server info');
        }

        const features = getFeatures(VERSION_INFO, res.body.Version);

        return {
            features,
            id: apiClientProps.server?.id,
            version: res.body.Version,
        };
    },
    getSimilarSongs: async (args) => {
        const { apiClientProps, query } = args;

        const res = await embyApiClient(apiClientProps).getSimilarSongs({
            params: {
                id: query.songId,
            },
            query: {
                Fields: 'Genres,DateCreated,MediaSources,ParentId',
                Limit: query.count,
                UserId: apiClientProps.server?.userId || undefined,
            },
        });

        if (res.status !== 200) {
            const mix = await embyApiClient(apiClientProps).getInstantMix({
                params: {
                    id: query.songId,
                },
                query: {
                    Fields: 'Genres,DateCreated,MediaSources,ParentId',
                    Limit: query.count,
                    UserId: apiClientProps.server?.userId || undefined,
                },
            });

            if (mix.status !== 200) {
                throw new Error('Failed to get similar songs or instant mix');
            }

            return mix.body.Items.reduce<Song[]>((acc, song) => {
                if (song.Id !== query.songId) {
                    acc.push(embyNormalize.song(song, apiClientProps.server, ''));
                }
                return acc;
            }, []);
        }

        return res.body.Items.reduce<Song[]>((acc, song) => {
            if (song.Id !== query.songId) {
                acc.push(embyNormalize.song(song, apiClientProps.server, ''));
            }
            return acc;
        }, []);
    },
    getSongDetail: async (args) => {
        const { apiClientProps, query } = args;

        const res = await embyApiClient(apiClientProps).getSongDetail({
            params: {
                id: query.id,
                userId: apiClientProps.server?.userId ?? '',
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song detail');
        }

        return embyNormalize.song(res.body, apiClientProps.server, '');
    },
    getSongList: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps).getSongList({
            query: {
                ArtistIds: query.artistIds
                    ? formatCommaDelimitedString(query.artistIds)
                    : undefined,
                Fields: 'Genres,DateCreated,MediaSources,ParentId',
                GenreIds: query.genreIds?.join(','),
                IncludeItemTypes: 'Audio',
                IsFavorite: query.favorite,
                Limit: query.limit,
                ParentId: musicLibraryId,
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

        return {
            items: res.body.Items.map((item) =>
                embyNormalize.song(item, apiClientProps.server, '', query.imageSize),
            ),
            startIndex: query.startIndex,
            totalRecordCount: res.body.TotalRecordCount,
        };
    },
    getSongListCount: async ({ apiClientProps, query }) =>
        EmbyController.getSongList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getTags: async () => {
        // Emby does not support tags in the same way as Jellyfin
        return { boolTags: [], enumTags: [] };
    },
    getTopSongs: async (args) => {
        const { apiClientProps, query } = args;
        await EmbyController.getMusicFolderList({ apiClientProps });

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps).getSongList({
            query: {
                ArtistIds: query.artistId,
                Fields: 'Genres,DateCreated,MediaSources,ParentId',
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
                embyNormalize.song(item, apiClientProps.server, ''),
            ),
            startIndex: 0,
            totalRecordCount: res.body.TotalRecordCount,
        };
    },
    getTranscodingUrl: (args) => {
        const { base, bitrate, format } = args.query;
        let url = base;
        if (format) {
            url += `&audioCodec=${format}`;
        }
        if (bitrate !== undefined) {
            url += `&audioBitRate=${bitrate * 1000}`;
        }
        return url;
    },
    movePlaylistItem: async () => {
        // Emby does not support moving playlist items directly.
        // This would require removing and re-adding at a specific position, which is complex.
        return;
    },
    removeFromPlaylist: async (args) => {
        const { apiClientProps, query } = args;

        const chunks = chunk(query.songId, MAX_ITEMS_PER_PLAYLIST_ADD);

        for (const chunk of chunks) {
            const res = await embyApiClient(apiClientProps).removeFromPlaylist({
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
    scrobble: async (args) => {
        const { apiClientProps, query } = args;
        const playSessionId = apiClientProps.server?.id + '-' + query.id; // Create a pseudo play session id
        const position = query.position && Math.round(query.position * 10000);

        if (!apiClientProps.server?.userId) {
            throw new Error('no user id');
        }

        if (query.submission) {
            await embyApiClient(apiClientProps).scrobbleMarkPlayed({
                params: {
                    id: query.id,
                    userId: apiClientProps.server.userId,
                },
                query: {},
            });
            return null;
        }

        if (query.event === 'start') {
            await embyApiClient(apiClientProps).scrobblePlaying({
                body: {
                    ItemId: query.id,
                    PlaySessionId: playSessionId,
                },
            });
            return null;
        }

        await embyApiClient(apiClientProps).scrobbleProgress({
            body: {
                EventName: query.event,
                IsPaused: query.event === 'pause',
                ItemId: query.id,
                PlaySessionId: playSessionId,
                PositionTicks: position,
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
            const res = await embyApiClient(apiClientProps).getAlbumList({
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
            const res = await embyApiClient(apiClientProps).getAlbumArtistList({
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
            const res = await embyApiClient(apiClientProps).getSongList({
                query: {
                    EnableTotalRecordCount: true,
                    Fields: 'Genres,DateCreated,MediaSources,ParentId',
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
                embyNormalize.albumArtist(item, apiClientProps.server),
            ),
            albums: await Promise.all(
                albums.map((item) =>
                    embyNormalize.album(
                        item,
                        apiClientProps.server,
                        embyApiClient(apiClientProps),
                        apiClientProps,
                    ),
                ),
            ),
            songs: songs.map((item) => embyNormalize.song(item, apiClientProps.server, '')),
        };
    },
    updatePlaylist: async (args) => {
        const { apiClientProps, body, query } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await embyApiClient(apiClientProps).updatePlaylist({
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
