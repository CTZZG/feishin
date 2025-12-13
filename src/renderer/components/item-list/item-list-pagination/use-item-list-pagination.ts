import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { parseIntParam, setSearchParam } from '/@/renderer/utils/query-params';

export const useItemListPagination = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = useMemo(() => {
        const value = parseIntParam(searchParams, 'currentPage');
        return value ?? 0;
    }, [searchParams]);

    const onChange = (index: number) => {
        setSearchParams((prev) => setSearchParam(prev, 'currentPage', index), { replace: true });
    };

    return { currentPage, onChange };
};
