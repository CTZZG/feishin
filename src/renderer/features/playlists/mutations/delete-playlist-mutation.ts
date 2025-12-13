import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    applyDeletePlaylistOptimisticUpdates,
    PreviousQueryData,
    restorePlaylistQueryData,
} from '/@/renderer/features/playlists/mutations/playlist-optimistic-updates';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { DeletePlaylistArgs, DeletePlaylistResponse } from '/@/shared/types/domain-types';

export const useDeletePlaylist = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<DeletePlaylistResponse, AxiosError, DeletePlaylistArgs, PreviousQueryData[]>(
        {
            mutationFn: (args) => {
                return api.controller.deletePlaylist({
                    ...args,
                    apiClientProps: { serverId: args.apiClientProps.serverId },
                });
            },
            onError: (_error, _variables, context) => {
                if (context) {
                    restorePlaylistQueryData(queryClient, context);
                }
            },
            onMutate: (variables) => {
                queryClient.cancelQueries({
                    queryKey: queryKeys.playlists.list(variables.apiClientProps.serverId),
                });
                return applyDeletePlaylistOptimisticUpdates(queryClient, variables);
            },
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({
                    exact: false,
                    queryKey: queryKeys.playlists.list(variables.apiClientProps.serverId),
                });
            },
            ...options,
        },
    );
};
