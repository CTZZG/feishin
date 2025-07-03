import { nanoid } from 'nanoid';
import { z } from 'zod';

import { embyType } from '/@/shared/api/emby/emby-types';
import {
    Album,
    AlbumArtist,
    Genre,
    LibraryItem,
    MusicFolder,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';
import { ServerListItem, ServerType } from '/@/shared/types/types';

type EmbyGenre = z.infer<typeof embyType._response.genre>;
type EmbyMusicFolder = z.infer<typeof embyType._response.musicFolderList>['Items'][number];

const getStreamUrl = (args: { id: string; server: null | ServerListItem }) => {
    const { id, server } = args;

    if (!server) return '';

    return `${server.url}/Audio/${id}/stream?static=true&api_key=${server.credential}`;
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

const normalizeSong = (
    item: z.infer<typeof embyType._response.song>,
    server: null | ServerListItem,
    deviceId: string,
    imageSize?: number,
): Song => {
    return {
        album: item.Album,
        albumArtists: item.AlbumArtists?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            name: entry.Name,
        })),
        albumId: item.AlbumId || `dummy/${item.Id}`,
        artistName: item?.ArtistItems?.[0]?.Name,
        artists: item?.ArtistItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            name: entry.Name,
        })),
        bitRate: null, // Emby does not provide this directly in the main song object
        bpm: null,
        channels: null,
        comment: null,
        compilation: null,
        container: item.MediaSources?.[0]?.Container || null,
        createdAt: item.DateCreated,
        discNumber: item.ParentIndexNumber || 1,
        discSubtitle: null,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        gain: null, // Emby does not provide normalization data
        genres: item.GenreItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            itemType: LibraryItem.GENRE,
            name: entry.Name,
        })),
        id: item.Id,
        imagePlaceholderUrl: null,
        imageUrl: getImageUrl({
            baseUrl: server?.url || '',
            imageType: 'Primary',
            itemId: item.Id,
            size: imageSize || 100,
            tag: item.ImageTags?.Primary,
        }),
        itemType: LibraryItem.SONG,
        lastPlayedAt: null,
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
        serverId: server?.id || '',
        serverType: ServerType.EMBY,
        size: item.MediaSources?.[0]?.Size,
        streamUrl: getStreamUrl({
            id: item.Id,
            server,
        }),
        tags: null,
        trackNumber: item.IndexNumber,
        uniqueId: nanoid(),
        updatedAt: item.DateCreated,
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: null,
    };
};

const normalizeAlbum = (
    item: z.infer<typeof embyType._response.album>,
    server: null | ServerListItem,
    imageSize?: number,
): Album => {
    return {
        albumArtist: item.ArtistItems?.[0]?.Name,
        albumArtists:
            item.AlbumArtists?.map((entry) => ({
                id: entry.Id,
                imageUrl: null,
                name: entry.Name,
            })) || [],
        artists: item.ArtistItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            name: entry.Name,
        })),
        backdropImageUrl: null,
        comment: null,
        createdAt: item.DateCreated,
        duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : 0,
        genres: item.GenreItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            itemType: LibraryItem.GENRE,
            name: entry.Name,
        })),
        id: item.Id,
        imagePlaceholderUrl: null,
        imageUrl: getImageUrl({
            baseUrl: server?.url || '',
            imageType: 'Primary',
            itemId: item.Id,
            size: imageSize || 300,
            tag: item.ImageTags?.Primary,
        }),
        isCompilation: null,
        itemType: LibraryItem.ALBUM,
        lastPlayedAt: null,
        mbzId: null,
        name: item.Name,
        originalDate: null,
        participants: null,
        playCount: item.UserData?.PlayCount || 0,
        releaseDate: item.PremiereDate?.split('T')[0] || null,
        releaseYear: item.ProductionYear || null,
        serverId: server?.id || '',
        serverType: ServerType.EMBY,
        size: null,
        songCount: item?.ChildCount || null,
        songs: item.Songs?.map((song) => normalizeSong(song, server, '', imageSize)),
        tags: null,
        uniqueId: nanoid(),
        updatedAt: item?.DateLastMediaAdded || item.DateCreated,
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: null,
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
        genres: item.GenreItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            itemType: LibraryItem.GENRE,
            name: entry.Name,
        })),
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
        userRating: null,
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
};
