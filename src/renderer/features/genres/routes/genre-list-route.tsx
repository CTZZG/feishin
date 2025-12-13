import { useMemo, useState } from 'react';

import { ListContext } from '/@/renderer/context/list-context';
import { GenreListContent } from '/@/renderer/features/genres/components/genre-list-content';
import { GenreListHeader } from '/@/renderer/features/genres/components/genre-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { ItemListKey } from '/@/shared/types/types';

const GenreListRoute = () => {
    const pageKey = ItemListKey.GENRE;

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);

    const providerValue = useMemo(() => {
        return {
            id: undefined,
            itemCount,
            pageKey,
            setItemCount,
        };
    }, [itemCount, pageKey, setItemCount]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <GenreListHeader />
                <GenreListContent />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const GenreListRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <GenreListRoute />
        </PageErrorBoundary>
    );
};

export default GenreListRouteWithBoundary;
