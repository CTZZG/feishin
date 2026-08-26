import { z } from 'zod';

import { embyType } from '/@/shared/api/emby/emby-types';
import { coerceYear, parsePartialIsoDateFromApi } from '/@/shared/api/partial-iso-date';
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

const getPrimaryImageId = (item: {
    Id: string;
    ImageTags?: { Primary?: null | string };
    PrimaryImageItemId?: null | string;
    PrimaryImageTag?: null | string;
}) => {
    if (item.ImageTags?.Primary) {
        return item.Id;
    }

    if (item.PrimaryImageTag) {
        return item.PrimaryImageItemId || item.Id;
    }

    return null;
};

const getSongImageId = (item: z.infer<typeof embyType._response.song>) => {
    if (item.ImageTags?.Primary) {
        return item.Id;
    }

    if (item.PrimaryImageTag) {
        return item.PrimaryImageItemId || item.Id;
    }

    if (item.AlbumPrimaryImageTag && item.AlbumId) {
        return item.AlbumId;
    }

    return null;
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

// Emby returns `PremiereDate` as a full ISO datetime, but the domain model expects a partial ISO
// date (`YYYY`, `YYYY-MM`, or `YYYY-MM-DD`). Fall back to `ProductionYear` when no premiere is set.
const embyPremiereFields = (item: {
    PremiereDate?: string;
    ProductionYear?: number;
}): { originalYear: number; releaseDate: null | string; releaseYear: null | number } => {
    const premiere = parsePartialIsoDateFromApi(item.PremiereDate ?? null);
    const prodYear = coerceYear(item.ProductionYear);
    const releaseYear: null | number =
        premiere.year > 0 ? premiere.year : prodYear > 0 ? prodYear : null;
    const releaseDate = premiere.date ?? (prodYear > 0 ? String(prodYear) : null);
    const originalYear = premiere.year > 0 ? premiere.year : prodYear;

    return { originalYear, releaseDate, releaseYear };
};

const normalizeSong = (
    item: z.infer<typeof embyType._response.song>,
    server: null | ServerListItemWithCredential,
    _deviceId: string,
    _imageSize?: number,
): Song => {
    void _deviceId;
    void _imageSize;

    const audioMetadata = extractAudioMetadata(item.MediaSources || []);
    const { releaseDate, releaseYear } = embyPremiereFields(item);

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
        date: releaseDate ?? (releaseYear !== null ? String(releaseYear) : null),
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
        imageId: getSongImageId(item),
        imageUrl: null,
        lastPlayedAt: item.DatePlayed ? new Date(item.DatePlayed).toISOString() : null,
        lyrics: null,
        mbzAlbumId: null,
        mbzRecordingId: null,
        mbzTrackId: null,
        name: item.Name,
        participants: null, // Emby does not have a 'People' field in the same way
        path: item.MediaSources?.[0]?.Path || null,
        peak: null,
        playCount: item.UserData?.PlayCount || 0,
        playlistItemId: item.PlaylistItemId,
        releaseDate,
        releaseYear,
        sampleRate: audioMetadata.sampleRate,
        size: item.MediaSources?.[0]?.Size ?? 0,
        sortName: item.SortName ?? item.Name,
        tags: getTags(item),
        trackNumber: item.IndexNumber ?? 1,
        trackSubtitle: null,
        updatedAt: item.DateCreated ?? '',
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: item.UserData?.Rating || null,
        year: releaseYear,
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
    const { originalYear, releaseDate, releaseYear } = embyPremiereFields(item);

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
        imageId: getPrimaryImageId(item),
        imageUrl: null,
        isCompilation: null,
        lastPlayedAt: item.DatePlayed ? new Date(item.DatePlayed).toISOString() : null,
        mbzId: null,
        mbzReleaseGroupId: null,
        name: item.Name,
        originalDate: null,
        originalYear,
        participants: null,
        playCount: item.UserData?.PlayCount || 0,
        recordLabels: [],
        releaseDate,
        releaseType: null,
        releaseTypes: [],
        releaseYear,
        size: null,
        songCount: item.Songs?.length ?? item.ChildCount ?? null,
        songs: item.Songs?.map((song) => normalizeSong(song, server, deviceId, imageSize)),
        sortName: item.SortName ?? item.Name,
        tags: getTags(item),
        // Emby does not report per-track year ranges on the album payload.
        trackYearRange: null,
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
    _imageSize?: number,
): AlbumArtist => {
    void _imageSize;

    const similarArtists =
        item.similarArtists?.Items?.filter((entry) => entry.Name !== 'Various Artists').map(
            (entry) => ({
                id: entry.Id,
                imageId: getPrimaryImageId(entry),
                imageUrl: null,
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
        imageId: getPrimaryImageId(item),
        imageUrl: null,
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
    _imageSize?: number,
): Playlist => {
    void _imageSize;

    return {
        _itemType: LibraryItem.PLAYLIST,
        _serverId: server?.id || '',
        _serverType: ServerType.EMBY,
        description: null,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        genres: [],
        id: item.Id,
        imageId: getPrimaryImageId(item),
        imageUrl: null,
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
        imageId: getPrimaryImageId(item),
        imageUrl: null,
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
