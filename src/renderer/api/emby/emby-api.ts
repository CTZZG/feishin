import { initClient, initContract } from '@ts-rest/core';
import axios, { AxiosError, AxiosResponse, isAxiosError, Method } from 'axios';
import omitBy from 'lodash/omitBy';
import qs from 'qs';
import { z } from 'zod';

import packageJson from '../../../../package.json';

import i18n from '/@/i18n/i18n';
import { authenticationFailure } from '/@/renderer/api/utils';
import { useAuthStore } from '/@/renderer/store';
import { getServerUrl } from '/@/renderer/utils/normalize-server-url';
import { embyType } from '/@/shared/api/emby/emby-types';
import { getClientType } from '/@/shared/api/utils';
import { ServerListItemWithCredential } from '/@/shared/types/domain-types';

const c = initContract();

export const contract = c.router({
    addTags: {
        body: embyType._parameters.addTags,
        method: 'POST',
        path: 'items/:id/tags/add',
        responses: {
            204: embyType._response.addTags,
            400: embyType._response.error,
        },
    },
    addToPlaylist: {
        body: z.null(),
        method: 'POST',
        path: 'playlists/:id/items',
        query: embyType._parameters.addToPlaylist,
        responses: {
            204: embyType._response.addToPlaylist,
            400: embyType._response.error,
        },
    },
    authenticate: {
        body: embyType._parameters.authenticate,
        method: 'POST',
        path: 'users/authenticatebyname',
        responses: {
            200: embyType._response.authenticate,
            400: embyType._response.error,
        },
    },
    createFavorite: {
        body: embyType._parameters.favorite,
        method: 'POST',
        path: 'users/:userId/favoriteitems/:id',
        responses: {
            200: embyType._response.favorite,
            400: embyType._response.error,
        },
    },
    createPlaylist: {
        body: embyType._parameters.createPlaylist,
        method: 'POST',
        path: 'playlists',
        responses: {
            200: embyType._response.createPlaylist,
            400: embyType._response.error,
        },
    },
    deletePlaylist: {
        body: null,
        method: 'DELETE',
        path: 'items/:id',
        responses: {
            204: embyType._response.deletePlaylist,
            400: embyType._response.error,
        },
    },
    deleteRating: {
        body: embyType._parameters.deleteRating,
        method: 'DELETE',
        path: 'users/:userId/items/:id/rating',
        responses: {
            200: embyType._response.deleteRating,
            400: embyType._response.error,
        },
    },
    getAlbumArtistDetail: {
        method: 'GET',
        path: 'users/:userId/items/:id',
        query: embyType._parameters.albumArtistDetail,
        responses: {
            200: embyType._response.albumArtist,
            400: embyType._response.error,
        },
    },
    getAlbumArtistList: {
        method: 'GET',
        path: 'artists/albumartists',
        query: embyType._parameters.albumArtistList,
        responses: {
            200: embyType._response.albumArtistList,
            400: embyType._response.error,
        },
    },
    getAlbumDetail: {
        method: 'GET',
        path: 'users/:userId/items/:id',
        query: embyType._parameters.albumDetail,
        responses: {
            200: embyType._response.album,
            400: embyType._response.error,
        },
    },
    getAlbumList: {
        method: 'GET',
        path: 'items',
        query: embyType._parameters.albumList,
        responses: {
            200: embyType._response.albumList,
            400: embyType._response.error,
        },
    },
    getArtistList: {
        method: 'GET',
        path: 'artists',
        query: embyType._parameters.albumArtistList,
        responses: {
            200: embyType._response.albumArtistList,
            400: embyType._response.error,
        },
    },
    getFilterList: {
        method: 'GET',
        path: 'items/filters',
        query: embyType._parameters.filterList,
        responses: {
            200: embyType._response.filters,
            400: embyType._response.error,
        },
    },
    getGenreList: {
        method: 'GET',
        path: 'genres',
        query: embyType._parameters.genreList,
        responses: {
            200: embyType._response.genreList,
            400: embyType._response.error,
        },
    },
    getInstantMix: {
        method: 'GET',
        path: 'items/:id/instantmix',
        query: embyType._parameters.similarSongs,
        responses: {
            200: embyType._response.songList,
            400: embyType._response.error,
        },
    },
    getMusicFolderList: {
        method: 'GET',
        path: 'users/:userId/views',
        responses: {
            200: embyType._response.musicFolderList,
            400: embyType._response.error,
        },
    },
    getPlaylistDetail: {
        method: 'GET',
        path: 'users/:userId/items/:id',
        query: embyType._parameters.playlistDetail,
        responses: {
            200: embyType._response.playlist,
            400: embyType._response.error,
        },
    },
    getPlaylistList: {
        method: 'GET',
        path: 'items',
        query: embyType._parameters.playlistList,
        responses: {
            200: embyType._response.playlistList,
            400: embyType._response.error,
        },
    },
    getPlaylistSongList: {
        method: 'GET',
        path: 'playlists/:id/items',
        query: embyType._parameters.songList,
        responses: {
            200: embyType._response.playlistSongList,
            400: embyType._response.error,
        },
    },
    getServerInfo: {
        method: 'GET',
        path: 'system/info',
        responses: {
            200: embyType._response.serverInfo,
            400: embyType._response.error,
        },
    },
    getSimilarArtistList: {
        method: 'GET',
        path: 'artists/:id/similar',
        query: embyType._parameters.similarArtistList,
        responses: {
            200: embyType._response.albumArtistList,
            400: embyType._response.error,
        },
    },
    getSimilarSongs: {
        method: 'GET',
        path: 'items/:id/similar',
        query: embyType._parameters.similarSongs,
        responses: {
            200: embyType._response.similarSongs,
            400: embyType._response.error,
        },
    },
    getSongDetail: {
        method: 'GET',
        path: 'users/:userId/items/:id',
        query: embyType._parameters.songDetail,
        responses: {
            200: embyType._response.song,
            400: embyType._response.error,
        },
    },
    getSongList: {
        method: 'GET',
        path: 'items',
        query: embyType._parameters.songList,
        responses: {
            200: embyType._response.songList,
            400: embyType._response.error,
        },
    },
    getSongLyrics: {
        method: 'GET',
        path: 'items/:id/:mediaSourceId/subtitles/:index/stream.js',
        responses: {
            200: embyType._response.lyrics,
            404: embyType._response.error,
        },
    },
    getTags: {
        method: 'GET',
        path: 'tags',
        query: embyType._parameters.tagList,
        responses: {
            200: embyType._response.tagList,
            400: embyType._response.error,
        },
    },
    getUserInfo: {
        method: 'GET',
        path: 'users/:id',
        responses: {
            200: embyType._response.user,
            400: embyType._response.error,
        },
    },
    movePlaylistItem: {
        body: z.null(),
        method: 'POST',
        path: 'playlists/:playlistId/items/:itemId/move/:newIndex',
        responses: {
            204: embyType._response.movePlaylistItem,
            400: embyType._response.error,
        },
    },
    removeFavorite: {
        body: embyType._parameters.favorite,
        method: 'DELETE',
        path: 'users/:userId/favoriteitems/:id',
        responses: {
            200: embyType._response.favorite,
            400: embyType._response.error,
        },
    },
    removeFromPlaylist: {
        body: null,
        method: 'DELETE',
        path: 'playlists/:id/items',
        query: embyType._parameters.removeFromPlaylist,
        responses: {
            204: embyType._response.removeFromPlaylist,
            400: embyType._response.error,
        },
    },
    removeTags: {
        body: embyType._parameters.removeTags,
        method: 'POST',
        path: 'items/:id/tags/delete',
        responses: {
            204: embyType._response.removeTags,
            400: embyType._response.error,
        },
    },
    scrobbleMarkPlayed: {
        body: null,
        method: 'POST',
        path: 'users/:userId/playeditems/:id',
        query: embyType._parameters.scrobbleMarkPlayed,
        responses: {
            200: embyType._response.favorite,
            400: embyType._response.error,
        },
    },
    scrobblePlaying: {
        body: embyType._parameters.scrobblePlaying,
        method: 'POST',
        path: 'sessions/playing',
        responses: {
            204: embyType._response.scrobble,
            400: embyType._response.error,
        },
    },
    scrobbleProgress: {
        body: embyType._parameters.scrobbleProgress,
        method: 'POST',
        path: 'sessions/playing/progress',
        responses: {
            204: embyType._response.scrobble,
            400: embyType._response.error,
        },
    },
    scrobbleStopped: {
        body: embyType._parameters.scrobbleStopped,
        method: 'POST',
        path: 'sessions/playing/stopped',
        responses: {
            204: embyType._response.scrobble,
            400: embyType._response.error,
        },
    },
    search: {
        method: 'GET',
        path: 'items',
        query: embyType._parameters.search,
        responses: {
            200: embyType._response.search,
            400: embyType._response.error,
        },
    },
    setRating: {
        body: embyType._parameters.setRating,
        method: 'POST',
        path: 'users/:userId/items/:id/rating',
        responses: {
            200: embyType._response.setRating,
            400: embyType._response.error,
        },
    },
    updatePlaylist: {
        body: embyType._parameters.updatePlaylist,
        method: 'POST',
        path: 'items/:id',
        responses: {
            204: embyType._response.updatePlaylist,
            400: embyType._response.error,
        },
    },
});

const axiosClient = axios.create({});

axiosClient.defaults.paramsSerializer = (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
};

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            const currentServer = useAuthStore.getState().currentServer;

            if (currentServer) {
                useAuthStore
                    .getState()
                    .actions.updateServer(currentServer.id, { credential: undefined });
            }

            authenticationFailure(currentServer);
        }

        return Promise.reject(error);
    },
);

const parsePath = (fullPath: string) => {
    const [path, params] = fullPath.split('?');

    const parsedParams = qs.parse(params);
    const notNilParams = omitBy(parsedParams, (value) => value === 'undefined' || value === 'null');

    return {
        params: notNilParams,
        path,
    };
};

export const createAuthHeader = (server: null | ServerListItemWithCredential): string => {
    const authStore = useAuthStore.getState();
    const token = (server as any)?.credential || '';
    const userId = server?.userId || '';

    return `Emby UserId="${userId}", Client="Feishin", Device="${getClientType()}", DeviceId="${authStore.deviceId}", Version="${packageJson.version}", Token="${token}"`;
};

export const embyApiClient = (args: {
    server: null | ServerListItemWithCredential;
    signal?: AbortSignal;
    url?: string;
}) => {
    const { server, signal, url } = args;

    return initClient(contract, {
        api: async ({ body, headers, method, path }) => {
            let baseUrl: string | undefined;

            const { params, path: api } = parsePath(path);

            if (server) {
                baseUrl = getServerUrl(server) || server.url;
            } else {
                baseUrl = url;
            }

            try {
                const result = await axiosClient.request({
                    data: body,
                    headers: {
                        ...headers,
                        'X-Emby-Authorization': createAuthHeader(server),
                    },
                    method: method as Method,
                    params,
                    signal,
                    url: `${baseUrl}/${api}`,
                });
                return {
                    body: result.data,
                    headers: result.headers as any,
                    status: result.status,
                };
            } catch (e: any | AxiosError | Error) {
                if (isAxiosError(e)) {
                    if (e.code === 'ERR_NETWORK') {
                        throw new Error(
                            i18n.t('error.networkError', {
                                postProcess: 'sentenceCase',
                            }) as string,
                        );
                    }

                    const error = e as AxiosError;
                    const response = error.response as AxiosResponse;
                    return {
                        body: response?.data,
                        headers: response?.headers as any,
                        status: response.status,
                    };
                }
                throw e;
            }
        },
        baseHeaders: {
            'Content-Type': 'application/json',
        },
        baseUrl: '',
        jsonQuery: false,
    });
};
