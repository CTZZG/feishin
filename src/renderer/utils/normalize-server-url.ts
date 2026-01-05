import { ServerListItem } from '/@/shared/types/domain-types';

export const normalizeServerUrl = (url: string) => {
    // Remove trailing slash
    return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const getServerUrl = (
    server: null | ServerListItem | undefined,
    forceRemoteUrl?: boolean,
): string | undefined => {
    if (!server) {
        return undefined;
    }

    if (!forceRemoteUrl && !server.preferRemoteUrl) {
        return server.url;
    }

    if (!server.remoteUrl) {
        return server.url;
    }

    return server.remoteUrl;
};
