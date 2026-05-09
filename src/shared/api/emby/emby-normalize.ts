import { z } from 'zod';

import { embyType } from '/@/shared/api/emby/emby-types';
import {
    Album,
    AlbumArtist,
    Genre,
    LibraryItem,
    MusicFolder,
    Playlist,
    ServerListItemWithCredential,
    ServerType,
    Song,
} from '/@/shared/types/domain-types';

type EmbyGenre = z.infer<typeof embyType._response.genre>;
type EmbyMusicFolder = z.infer<typeof embyType._response.musicFolderList>['Items'][number];

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
    server: null | ServerListItemWithCredential,
    _deviceId: string,
    imageSize?: number,
): Song => {
    const audioMetadata = extractAudioMetadata(item.MediaSources || []);

    // 三级图片回退逻辑
    const getSongImageUrl = () => {
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

        return null;
    };
    return {
        _itemType: LibraryItem.SONG,
        _serverId: server?.id || '',
        _serverType: ServerType.EMBY,
        album: item.Album ?? null,
        albumArtistName: item.AlbumArtist ?? '',
        albumArtists:
            item.AlbumArtists?.map((entry) => ({
                id: entry.Id,
                imageId: null,
                imageUrl: null,
                name: entry.Name,
                userFavorite: false,
                userRating: null,
            })) ?? [],
        albumId: item.AlbumId || `dummy/${item.Id}`,
        artistName: item?.ArtistItems?.[0]?.Name ?? '',
        artists:
            item?.ArtistItems?.map((entry) => ({
                id: entry.Id,
                imageId: null,
                imageUrl: null,
                name: entry.Name,
                userFavorite: false,
                userRating: null,
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
        explicitStatus: null,
        gain: null,
        genres:
            (item.GenreItems?.map((entry) => ({
                _itemType: LibraryItem.GENRE,
                id: entry.Id,
                imageId: null,
                imageUrl: null,
                name: entry.Name,
            })) as any) ?? [],
        id: item.Id,
        imageId: null,

        imageUrl: getSongImageUrl(),
        lastPlayedAt: item.DatePlayed ? new Date(item.DatePlayed).toISOString() : null,
        lyrics: null,
        mbzRecordingId: null,
        mbzTrackId: null,
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

        releaseYear: item.ProductionYear ? Number(item.ProductionYear) : null,
        sampleRate: audioMetadata.sampleRate,
        size: item.MediaSources?.[0]?.Size ?? 0,
        sortName: item.SortName ?? item.Name,
        tags: getTags(item),
        trackNumber: item.IndexNumber ?? 1,
        trackSubtitle: null,
        updatedAt: item.DateCreated ?? '',
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: item.UserData?.Rating || null,
    };
};

const normalizeAlbum = async (
    item: z.infer<typeof embyType._response.album>,
    server: null | ServerListItemWithCredential,
    _apiClient: any,
    _apiClientProps: { server?: null | ServerListItemWithCredential },
    imageSize?: number,
): Promise<Album> => {
    const deviceId = server?.id || '';
    const imageUrl = getImageUrl({
        baseUrl: server?.url || '',
        imageType: 'Primary',
        itemId: item.Id,
        size: imageSize || 300,
        tag: item.ImageTags?.Primary,
    });

    return {
        _itemType: LibraryItem.ALBUM,
        _serverId: server?.id || '',
        _serverType: ServerType.EMBY,
        albumArtistName: item.ArtistItems?.[0]?.Name ?? '',
        albumArtists:
            item.AlbumArtists?.map((entry) => ({
                id: entry.Id,
                imageId: null,
                imageUrl: null,
                name: entry.Name,
                userFavorite: false,
                userRating: null,
            })) || [],
        artists:
            item.ArtistItems?.map((entry) => ({
                id: entry.Id,
                imageId: null,
                imageUrl: null,
                name: entry.Name,
                userFavorite: false,
                userRating: null,
            })) ?? [],

        comment: null,
        createdAt: item.DateCreated ?? '',
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        explicitStatus: null,
        genres:
            (item.GenreItems?.map((entry) => ({
                _itemType: LibraryItem.GENRE,
                id: entry.Id,
                imageId: null,
                imageUrl: null,
                name: entry.Name,
            })) as any) ?? [],
        id: item.Id,
        imageId: null,

        imageUrl,
        isCompilation: null,
        lastPlayedAt: item.DatePlayed ? new Date(item.DatePlayed).toISOString() : null,
        mbzId: null,
        mbzReleaseGroupId: null,
        name: item.Name,
        originalDate: null,
        originalYear: item.ProductionYear ?? 0,
        participants: null,
        playCount: item.UserData?.PlayCount || 0,
        recordLabels: [],
        releaseDate: item.PremiereDate
            ? new Date(item.PremiereDate).toISOString()
            : item.ProductionYear
              ? new Date(item.ProductionYear, 0, 1).toISOString()
              : null,
        releaseType: null,
        releaseTypes: [],
        releaseYear: item.ProductionYear ?? null,
        size: null,
        songCount: item.Songs?.length ?? item.ChildCount ?? null,
        songs: item.Songs?.map((song) => normalizeSong(song, server, deviceId, imageSize)),
        sortName: item.SortName ?? item.Name,
        tags: getTags(item),
        updatedAt: (item?.DateLastMediaAdded || item.DateCreated) ?? '',
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: item.UserData?.Rating || null,
        version: null,
    };
};

const normalizeAlbumArtist = (
    item: z.infer<typeof embyType._response.albumArtist> & {
        similarArtists?: z.infer<typeof embyType._response.albumArtistList>;
    },
    server: null | ServerListItemWithCredential,
    imageSize?: number,
): AlbumArtist => {
    const similarArtists =
        item.similarArtists?.Items?.filter((entry) => entry.Name !== 'Various Artists').map(
            (entry) => ({
                id: entry.Id,
                imageId: null,
                imageUrl: getImageUrl({
                    baseUrl: server?.url || '',
                    imageType: 'Primary',
                    itemId: entry.Id,
                    size: imageSize || 300,
                    tag: entry.ImageTags?.Primary,
                }),
                name: entry.Name,
                userFavorite: false,
                userRating: null,
            }),
        ) || [];

    return {
        _itemType: LibraryItem.ALBUM_ARTIST,
        _serverId: server?.id || '',
        _serverType: ServerType.EMBY,
        albumCount: item.AlbumCount ?? null,
        biography: item.Overview || null,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        genres:
            (item.GenreItems?.map((entry) => ({
                _itemType: LibraryItem.GENRE,
                id: entry.Id,
                imageId: null,
                imageUrl: null,
                name: entry.Name,
            })) as any) ?? [],
        id: item.Id,
        imageId: null,
        imageUrl: getImageUrl({
            baseUrl: server?.url || '',
            imageType: 'Primary',
            itemId: item.Id,
            size: imageSize || 300,
            tag: item.ImageTags?.Primary,
        }),
        lastPlayedAt: null,
        mbz: null,
        name: item.Name,
        playCount: item.UserData?.PlayCount || 0,
        similarArtists,
        songCount: item.SongCount ?? null,
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: item.UserData?.Rating || null,
    };
};

const normalizePlaylist = (
    item: z.infer<typeof embyType._response.playlist>,
    server: null | ServerListItemWithCredential,
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
        _itemType: LibraryItem.PLAYLIST,
        _serverId: server?.id || '',
        _serverType: ServerType.EMBY,
        description: null,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        genres: [],
        id: item.Id,
        imageId: null,
        imageUrl: imageUrl || null,
        name: item.Name,
        owner: null,
        ownerId: null,
        public: null,
        rules: null,
        size: null,
        songCount: item?.ChildCount || null,
        sync: null,
    } as unknown as Playlist;
};

const normalizeMusicFolder = (item: EmbyMusicFolder): MusicFolder => {
    return {
        id: item.Id,
        name: item.Name,
    };
};

const normalizeGenre = (item: EmbyGenre, server: null | ServerListItemWithCredential): Genre => {
    return {
        _itemType: LibraryItem.GENRE,
        _serverId: server?.id || '',
        _serverType: ServerType.EMBY,
        albumCount: null,
        id: item.Id,
        imageId: null,
        imageUrl: getImageUrl({
            baseUrl: server?.url || '',
            imageType: 'Primary',
            itemId: item.Id,
            size: 200,
            tag: item.ImageTags?.Primary,
        }),
        name: item.Name,
        songCount: null,
    };
};

export const embyNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    genre: normalizeGenre,
    musicFolder: normalizeMusicFolder,
    playlist: normalizePlaylist,
    song: normalizeSong,
};
