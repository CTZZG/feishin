import { useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { ListContext } from '/@/renderer/context/list-context';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { GenreDetailContent } from '/@/renderer/features/genres/components/genre-detail-content';
import { GenreDetailHeader } from '/@/renderer/features/genres/components/genre-detail-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';

const GenreDetailRoute = () => {
    const { genreId } = useParams() as { genreId: string };
    const pageKey = 'genre';

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);

    const providerValue = useMemo(() => {
        return {
            id: genreId,
            itemCount,
            pageKey,
            setItemCount,
        };
    }, [genreId, itemCount, pageKey, setItemCount]);

    const { data: genres } = useGenreList();

    const name = useMemo(() => {
        return genres?.items.find((g) => g.id === genreId)?.name || '—';
    }, [genreId, genres]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <LibraryContainer>
                    <GenreDetailHeader title={name} />
                    <GenreDetailContent />
                </LibraryContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const GenreDetailRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <GenreDetailRoute />
        </PageErrorBoundary>
    );
};

export default GenreDetailRouteWithBoundary;
