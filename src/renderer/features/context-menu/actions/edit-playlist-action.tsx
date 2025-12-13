import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { openUpdatePlaylistModal } from '/@/renderer/features/playlists/components/update-playlist-form';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { toast } from '/@/shared/components/toast/toast';
import { Playlist } from '/@/shared/types/domain-types';

interface EditPlaylistActionProps {
    disabled?: boolean;
    items: Playlist[];
}

export const EditPlaylistAction = ({ disabled, items }: EditPlaylistActionProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();

    const handleEditPlaylist = useCallback(async () => {
        if (items.length === 0 || !server) return;

        // Only allow editing a single playlist at a time
        const playlist = items[0];

        try {
            // Fetch the full playlist detail
            const playlistDetail = await queryClient.fetchQuery({
                queryFn: ({ signal }) =>
                    api.controller.getPlaylistDetail({
                        apiClientProps: { serverId: server.id, signal },
                        query: { id: playlist.id },
                    }),
                queryKey: queryKeys.playlists.detail(server.id, playlist.id, { id: playlist.id }),
            });

            if (playlistDetail) {
                await openUpdatePlaylistModal({
                    playlist: playlistDetail,
                    server,
                });
            }
        } catch (err: any) {
            toast.error({
                message: err.message,
                title: t('error.genericError', { postProcess: 'sentenceCase' }),
            });
        }
    }, [items, server, t]);

    if (items.length === 0 || items.length > 1) return null;

    return (
        <ContextMenu.Item disabled={disabled} leftIcon="edit" onSelect={handleEditPlaylist}>
            {t('action.editPlaylist', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
