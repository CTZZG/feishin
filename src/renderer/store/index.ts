// Mocks for missing modules
export enum AlbumListFilter {
    ARTIST = 'artist',
    COMPILATION = 'compilation',
    FAVORITE = 'favorite',
    GENRE = 'genre',
    YEAR = 'year',
}

export * from './app.store';
export * from './auth.store';
export * from './full-screen-player.store';
export * from './player.store';
export * from './settings.store';
export * from './timestamp.store';

export enum SongListFilter {
    ARTIST = 'artist',
    FAVORITE = 'favorite',
    GENRE = 'genre',
    YEAR = 'year',
}

// Export ListKey manually as it seems missing
export type ListKey = string;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useListFilterByKey = <_T = any>(_key?: any) => {
    return {} as any;
};

export const useListStoreActions = () => {
    return { setFilter: (_args: any) => {} }; // eslint-disable-line @typescript-eslint/no-unused-vars
};
