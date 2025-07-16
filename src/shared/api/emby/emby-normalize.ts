import { nanoid } from 'nanoid';
import { z } from 'zod';

import { embyType } from '/@/shared/api/emby/emby-types';
import {
    Album,
    AlbumArtist,
    ControllerApiClient,
    Genre,
    LibraryItem,
    MusicFolder,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';
import { ServerListItem, ServerType } from '/@/shared/types/types';

type EmbyGenre = z.infer<typeof embyType._response.genre>;
type EmbyMusicFolder = z.infer<typeof embyType._response.musicFolderList>['Items'][number];

const getStreamUrl = (args: { deviceId: string; id: string; server: null | ServerListItem }) => {
    const { deviceId, id, server } = args;

    if (!server) return '';

    return `${server.url}/Audio/${id}/stream?static=true&api_key=${server.credential}&DeviceId=${deviceId}`;
};

const getImageUrl = (args: {
    baseUrl: string;
    imageType: 'Backdrop' | 'Logo' | 'Primary' | 'Thumb';
    itemId: string;
    size: number;
    tag?: null | string;
}) => {
    const { baseUrl, imageType, itemId, size, tag } = args;
    if (!tag) {
        return null;
    }
    return `${baseUrl}/Items/${itemId}/Images/${imageType}?width=${size}&quality=96&tag=${tag}`;
};

const extractAudioMetadata = (mediaSources: any[]) => {
    const audioStream = mediaSources?.[0]?.MediaStreams?.find(
        (stream: any) => stream.Type === 'Audio',
    );

    if (!audioStream) {
        return {
            bitDepth: null,
            bitRate: 0,
            channels: null,
            sampleRate: null,
        };
    }

    return {
        bitDepth: audioStream.BitDepth ?? null,
        bitRate: audioStream.BitRate ?? 0,
        channels: audioStream.Channels ?? null,
        sampleRate: audioStream.SampleRate ?? null,
    };
};

const getTags = (item: { Tags?: string[] }): null | Record<string, string[]> => {
    if (item.Tags && item.Tags.length > 0) {
        const tags: Record<string, string[]> = {};
        for (const tag of item.Tags) {
            tags[tag] = [];
        }
        return tags;
    }
    return null;
};

const normalizeSong = (
    item: z.infer<typeof embyType._response.song>,
    server: null | ServerListItem,
    deviceId: string,
    imageSize?: number,
): Song => {
    const audioMetadata = extractAudioMetadata(item.MediaSources || []);

    // 三级图片回退逻辑
    const getSongImageUrl = () => {
        // 第一级：检查歌曲自身封面
        let imageUrl = getImageUrl({
            baseUrl: server?.url || '',
            imageType: 'Primary',
            itemId: item.Id,
            size: imageSize || 100,
            tag: item.ImageTags?.Primary,
        });

        if (imageUrl) {
            return imageUrl;
        }

        // 第二级：检查专辑封面
        if (item.AlbumPrimaryImageTag && item.AlbumId) {
            imageUrl = getImageUrl({
                baseUrl: server?.url || '',
                imageType: 'Primary',
                itemId: item.AlbumId,
                size: imageSize || 100,
                tag: item.AlbumPrimaryImageTag,
            });

            if (imageUrl) {
                return imageUrl;
            }
        }

        // 第三级：歌手封面获取将在异步函数中处理
        return null;
    };

    return {
        album: item.Album ?? null,
        albumArtists:
            item.AlbumArtists?.map((entry) => ({
                id: entry.Id,
                imageUrl: null,
                name: entry.Name,
            })) ?? [],
        albumId: item.AlbumId || `dummy/${item.Id}`,
        artistName: item?.ArtistItems?.[0]?.Name ?? '',
        artists:
            item?.ArtistItems?.map((entry) => ({
                id: entry.Id,
                imageUrl: null,
                name: entry.Name,
            })) ?? [],
        bitDepth: audioMetadata.bitDepth,
        bitRate: audioMetadata.bitRate,
        bpm: null,
        channels: audioMetadata.channels,
        comment: null,
        compilation: null,
        container: item.MediaSources?.[0]?.Container || null,
        createdAt: item.DateCreated ?? '',
        discNumber: item.ParentIndexNumber || 1,
        discSubtitle: null,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        gain: null,
        genres:
            item.GenreItems?.map((entry) => ({
                id: entry.Id,
                imageUrl: null,
                itemType: LibraryItem.GENRE,
                name: entry.Name,
            })) ?? [],
        id: item.Id,
        imagePlaceholderUrl: null,
        imageUrl: getSongImageUrl(),
        itemType: LibraryItem.SONG,
        lastPlayedAt: item.DatePlayed ? new Date(item.DatePlayed).toISOString() : null,
        lyrics: null,
        name: item.Name,
        participants: null, // Emby does not have a 'People' field in the same way
        path: item.MediaSources?.[0]?.Path || null,
        peak: null,
        playCount: item.UserData?.PlayCount || 0,
        playlistItemId: item.PlaylistItemId,
        releaseDate: item.PremiereDate
            ? new Date(item.PremiereDate).toISOString()
            : item.ProductionYear
              ? new Date(item.ProductionYear, 0, 1).toISOString()
              : null,
        releaseYear: item.ProductionYear ? String(item.ProductionYear) : null,
        sampleRate: audioMetadata.sampleRate,
        serverId: server?.id || '',
        serverType: ServerType.EMBY,
        size: item.MediaSources?.[0]?.Size ?? 0,
        streamUrl: getStreamUrl({
            deviceId,
            id: item.Id,
            server,
        }),
        tags: getTags(item),
        trackNumber: item.IndexNumber ?? 1,
        uniqueId: nanoid(),
        updatedAt: item.DateCreated ?? '',
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: item.UserData?.Rating || null,
    };
};

const normalizeSongWithArtistFallback = async (
    item: z.infer<typeof embyType._response.song>,
    server: null | ServerListItem,
    deviceId: string,
    apiClient: any,
    imageSize?: number,
): Promise<Song> => {
    const song = normalizeSong(item, server, deviceId, imageSize);

    // 如果前两级都没有获取到图片，尝试第三级：歌手封面
    if (!song.imageUrl && item.ArtistItems && item.ArtistItems.length > 0) {
        try {
            const firstArtist = item.ArtistItems[0];

            const artistRes = await apiClient.getAlbumArtistDetail({
                params: {
                    id: firstArtist.Id,
                    userId: server?.userId || '',
                },
                query: {
                    Fields: 'ImageTags',
                },
            });

            if (artistRes.status === 200 && artistRes.body.ImageTags?.Primary) {
                const artistImageUrl = getImageUrl({
                    baseUrl: server?.url || '',
                    imageType: 'Primary',
                    itemId: firstArtist.Id,
                    size: imageSize || 100,
                    tag: artistRes.body.ImageTags.Primary,
                });
                song.imageUrl = artistImageUrl;
            }
        } catch {
            // 歌手封面获取失败时不影响其他功能，静默处理
        }
    }

    return song;
};

const normalizeAlbum = async (
    item: z.infer<typeof embyType._response.album>,
    server: null | ServerListItem,
    apiClient: any,
    apiClientProps: ControllerApiClient,
    imageSize?: number,
): Promise<Album> => {
    const deviceId = apiClientProps.server?.id || '';
    let imageUrl = getImageUrl({
        baseUrl: server?.url || '',
        imageType: 'Primary',
        itemId: item.Id,
        size: imageSize || 300,
        tag: item.ImageTags?.Primary,
    });

    if (!imageUrl) {
        const res = await apiClient.getSongList({
            query: {
                Fields: 'ImageTags',
                IncludeItemTypes: 'Audio',
                Limit: 1,
                ParentId: item.Id,
                UserId: apiClientProps.server?.userId,
            },
        });

        if (res.status === 200 && res.body.Items.length > 0) {
            const firstSong = res.body.Items[0];
            imageUrl = getImageUrl({
                baseUrl: server?.url || '',
                imageType: 'Primary',
                itemId: firstSong.Id,
                size: imageSize || 300,
                tag: firstSong.ImageTags?.Primary,
            });
        }
    }

    return {
        albumArtist: item.ArtistItems?.[0]?.Name ?? '',
        albumArtists:
            item.AlbumArtists?.map((entry) => ({
                id: entry.Id,
                imageUrl: null,
                name: entry.Name,
            })) || [],
        artists:
            item.ArtistItems?.map((entry) => ({
                id: entry.Id,
                imageUrl: null,
                name: entry.Name,
            })) ?? [],
        backdropImageUrl: null,
        comment: null,
        createdAt: item.DateCreated ?? '',
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        genres:
            item.GenreItems?.map((entry) => ({
                id: entry.Id,
                imageUrl: null,
                itemType: LibraryItem.GENRE,
                name: entry.Name,
            })) ?? [],
        id: item.Id,
        imagePlaceholderUrl: null,
        imageUrl,
        isCompilation: null,
        itemType: LibraryItem.ALBUM,
        lastPlayedAt: item.DatePlayed ? new Date(item.DatePlayed).toISOString() : null,
        mbzId: null,
        name: item.Name,
        originalDate: null,
        participants: null,
        playCount: item.UserData?.PlayCount || 0,
        releaseDate: item.PremiereDate
            ? new Date(item.PremiereDate).toISOString()
            : item.ProductionYear
              ? new Date(item.ProductionYear, 0, 1).toISOString()
              : null,
        releaseYear: item.ProductionYear ?? null,
        serverId: server?.id || '',
        serverType: ServerType.EMBY,
        size: null,
        songCount: item.Songs?.length ?? item.ChildCount ?? null,
        songs: item.Songs?.map((song) => normalizeSong(song, server, deviceId, imageSize)),
        tags: getTags(item),
        uniqueId: nanoid(),
        updatedAt: (item?.DateLastMediaAdded || item.DateCreated) ?? '',
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: item.UserData?.Rating || null,
    };
};

const normalizeAlbumArtist = (
    item: z.infer<typeof embyType._response.albumArtist> & {
        similarArtists?: z.infer<typeof embyType._response.albumArtistList>;
    },
    server: null | ServerListItem,
    imageSize?: number,
): AlbumArtist => {
    const similarArtists =
        item.similarArtists?.Items?.filter((entry) => entry.Name !== 'Various Artists').map(
            (entry) => ({
                id: entry.Id,
                imageUrl: getImageUrl({
                    baseUrl: server?.url || '',
                    imageType: 'Primary',
                    itemId: entry.Id,
                    size: imageSize || 300,
                    tag: entry.ImageTags?.Primary,
                }),
                name: entry.Name,
            }),
        ) || [];

    return {
        albumCount: item.AlbumCount ?? null,
        backgroundImageUrl: null,
        biography: item.Overview || null,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        genres:
            item.GenreItems?.map((entry) => ({
                id: entry.Id,
                imageUrl: null,
                itemType: LibraryItem.GENRE,
                name: entry.Name,
            })) ?? [],
        id: item.Id,
        imageUrl: getImageUrl({
            baseUrl: server?.url || '',
            imageType: 'Primary',
            itemId: item.Id,
            size: imageSize || 300,
            tag: item.ImageTags?.Primary,
        }),
        itemType: LibraryItem.ALBUM_ARTIST,
        lastPlayedAt: null,
        mbz: null,
        name: item.Name,
        playCount: item.UserData?.PlayCount || 0,
        serverId: server?.id || '',
        serverType: ServerType.EMBY,
        similarArtists,
        songCount: item.SongCount ?? null,
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: item.UserData?.Rating || null,
    };
};

const normalizePlaylist = (
    item: z.infer<typeof embyType._response.playlist>,
    server: null | ServerListItem,
    imageSize?: number,
): Playlist => {
    const imageUrl = getImageUrl({
        baseUrl: server?.url || '',
        imageType: 'Primary',
        itemId: item.Id,
        size: imageSize || 300,
        tag: item.ImageTags?.Primary,
    });

    return {
        description: null,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        genres: [],
        id: item.Id,
        imagePlaceholderUrl: null,
        imageUrl: imageUrl || null,
        itemType: LibraryItem.PLAYLIST,
        name: item.Name,
        owner: null,
        ownerId: null,
        public: null,
        rules: null,
        serverId: server?.id || '',
        serverType: ServerType.EMBY,
        size: null,
        songCount: item?.ChildCount || null,
        sync: null,
    };
};

const normalizeMusicFolder = (item: EmbyMusicFolder): MusicFolder => {
    return {
        id: item.Id,
        name: item.Name,
    };
};

const normalizeGenre = (item: EmbyGenre, server: null | ServerListItem): Genre => {
    return {
        albumCount: undefined,
        id: item.Id,
        imageUrl: getImageUrl({
            baseUrl: server?.url || '',
            imageType: 'Primary',
            itemId: item.Id,
            size: 200,
            tag: item.ImageTags?.Primary,
        }),
        itemType: LibraryItem.GENRE,
        name: item.Name,
        songCount: undefined,
    };
};

export const embyNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    genre: normalizeGenre,
    musicFolder: normalizeMusicFolder,
    playlist: normalizePlaylist,
    song: normalizeSong,
    songWithArtistFallback: normalizeSongWithArtistFallback,
};
