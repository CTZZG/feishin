import { z } from 'zod';

import { embyType } from '/@/shared/api/emby/emby-types';

export type EmbyAlbum = z.infer<typeof embyType._response.album>;
export type EmbyAlbumArtist = z.infer<typeof embyType._response.albumArtist>;
export type EmbyGenre = z.infer<typeof embyType._response.genre>;
export type EmbyMusicFolder = z.infer<typeof embyType._response.musicFolderList>['Items'][number];
export type EmbyPlaylist = z.infer<typeof embyType._response.playlist>;
export type EmbySong = z.infer<typeof embyType._response.song>;

export const EmbySortOrder = {
    ASC: 'Ascending',
    DESC: 'Descending',
} as const;
export type EmbySortOrder = (typeof EmbySortOrder)[keyof typeof EmbySortOrder];

export const EmbyAlbumListSort = embyType._enum.albumList;
export type EmbyAlbumListSort = (typeof EmbyAlbumListSort)[keyof typeof EmbyAlbumListSort];
export const EmbyAlbumArtistListSort = embyType._enum.albumArtistList;
export type EmbyAlbumArtistListSort =
    (typeof EmbyAlbumArtistListSort)[keyof typeof EmbyAlbumArtistListSort];
export const EmbySongListSort = embyType._enum.songList;
export type EmbySongListSort = (typeof EmbySongListSort)[keyof typeof EmbySongListSort];
export const EmbyGenreListSort = embyType._enum.genreList;
export type EmbyGenreListSort = (typeof EmbyGenreListSort)[keyof typeof EmbyGenreListSort];
export const EmbyPlaylistListSort = embyType._enum.playlistList;
export type EmbyPlaylistListSort = (typeof EmbyPlaylistListSort)[keyof typeof EmbyPlaylistListSort];
