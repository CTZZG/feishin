import Fuse from 'fuse.js';

import {
    InternetProviderLyricSearchResponse,
    LyricSearchQuery,
} from '/@/shared/types/domain-types';

export const orderSearchResults = (args: {
    params: LyricSearchQuery;
    results: InternetProviderLyricSearchResponse[];
}) => {
    const { params, results } = args;

    const options: any = {
        fieldNormWeight: 1,
        includeScore: true,
        keys: [
            { getFn: (song) => song.name, name: 'name', weight: 3 },
            { getFn: (song) => song.artist, name: 'artist' },
        ],
        threshold: 1.0,
    };

    const fuse = new Fuse(results, options);

    const searchResults = fuse.search({
        ...(params.artist && { artist: params.artist }),
        ...(params.name && { name: params.name }),
    } as any);

    return searchResults.map((result) => ({
        ...result.item,
        score: result.score,
    }));
};
