import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { parseIntParam, setSearchParam } from '/@/renderer/utils/query-params';

interface UseItemListScrollPersistProps {
    enabled: boolean;
}

export const useItemListScrollPersist = ({ enabled }: UseItemListScrollPersistProps) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const scrollOffset = useMemo(() => parseIntParam(searchParams, 'scrollOffset'), [searchParams]);

    const handleOnScrollEnd = (offset: number) => {
        if (!enabled) return;

        setSearchParams((prev) => setSearchParam(prev, 'scrollOffset', offset), { replace: true });
    };

    return { handleOnScrollEnd, scrollOffset };
};
