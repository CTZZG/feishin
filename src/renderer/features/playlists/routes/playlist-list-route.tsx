import { useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { ListContext } from '/@/renderer/context/list-context';
import { PlaylistListContent } from '/@/renderer/features/playlists/components/playlist-list-content';
import { PlaylistListHeader } from '/@/renderer/features/playlists/components/playlist-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { ItemListKey } from '/@/shared/types/types';

const PlaylistListRoute = () => {
    const { playlistId } = useParams();
    const pageKey = ItemListKey.PLAYLIST;

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);

    const providerValue = useMemo(() => {
        return {
            id: playlistId,
            itemCount,
            pageKey,
            setItemCount,
        };
    }, [playlistId, itemCount, pageKey, setItemCount]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <PlaylistListHeader />
                <PlaylistListContent />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const PlaylistListRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <PlaylistListRoute />
        </PageErrorBoundary>
    );
};

export default PlaylistListRouteWithBoundary;
