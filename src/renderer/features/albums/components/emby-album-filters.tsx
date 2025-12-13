import debounce from 'lodash/debounce';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useAlbumArtistList } from '/@/renderer/features/artists/hooks/use-album-artist-list';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { useTagList } from '/@/renderer/features/tag/queries/use-tag-list';
import { useListFilterByKey, useListStoreActions } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import {
    AlbumArtistListSort,
    AlbumListQuery,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';

interface EmbyAlbumFiltersProps {
    customFilters?: Partial<any>;
    disableArtistFilter?: boolean;
    onFilterChange: (filters: any) => void;
    pageKey: string;
    serverId?: string;
}

export const EmbyAlbumFilters = ({
    customFilters,
    disableArtistFilter,
    onFilterChange,
    pageKey,
    serverId,
}: EmbyAlbumFiltersProps) => {
    const { t } = useTranslation();
    const filter = useListFilterByKey<AlbumListQuery>({ key: pageKey });
    const { setFilter } = useListStoreActions();

    // TODO - eventually replace with /items/filters endpoint to fetch genres and tags specific to the selected library
    const genreListQuery = useGenreList({
        query: {
            musicFolderId: filter?.musicFolderId,
            sortBy: GenreListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId,
    });

    const genreList = useMemo(() => {
        if (!genreListQuery?.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const tagsQuery = useTagList({
        query: {
            folder: filter?.musicFolderId,
            type: LibraryItem.ALBUM,
        },
        serverId,
    });

    const embyTags = filter?._custom?.emby?.Tags;
    const selectedTags = useMemo(() => {
        return embyTags?.split('|');
    }, [embyTags]);

    const yesNoFilter = [
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (favorite?: boolean) => {
                const updatedFilters = setFilter({
                    customFilters,
                    data: {
                        _custom: filter?._custom,
                        favorite,
                    },
                    itemType: LibraryItem.ALBUM,
                    key: pageKey,
                }) as any;
                onFilterChange(updatedFilters);
            },
            value: filter?.favorite,
        },
    ];

    const handleMinYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: filter?._custom,
                minYear: e === '' ? undefined : (e as number),
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as any;
        onFilterChange(updatedFilters);
    }, 500);

    const handleMaxYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: filter?._custom,
                maxYear: e === '' ? undefined : (e as number),
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as any;
        onFilterChange(updatedFilters);
    }, 500);

    const handleGenresFilter = debounce((e: string[] | undefined) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: filter?._custom,
                genres: e,
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as any;
        onFilterChange(updatedFilters);
    }, 250);

    const [albumArtistSearchTerm, setAlbumArtistSearchTerm] = useState<string>('');

    const albumArtistListQuery = useAlbumArtistList({
        options: {
            cacheTime: 1000 * 60 * 2,
            staleTime: 1000 * 60 * 1,
        },
        query: {
            sortBy: AlbumArtistListSort.NAME,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
        },
        serverId,
    });

    const artistItems = albumArtistListQuery?.data?.items;
    const selectableAlbumArtists = useMemo(() => {
        if (!artistItems) return [];

        return artistItems.map((artist: any) => ({
            label: artist.name,
            value: artist.id,
        }));
    }, [artistItems]);

    const handleAlbumArtistFilter = (e: null | string[]) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: filter?._custom,
                artistIds: e || undefined,
            },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as any;
        onFilterChange(updatedFilters);
    };

    const handleTagFilter = debounce((e: string[] | undefined) => {
        const updatedFilters = setFilter({
            customFilters,
            data: {
                _custom: {
                    ...filter?._custom,
                    emby: {
                        ...filter?._custom?.emby,
                        Tags: e?.join('|') || undefined,
                    },
                },
            },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as any;
        onFilterChange(updatedFilters);
    }, 250);

    return (
        <Stack p="0.8rem">
            {yesNoFilter.map((filter) => (
                <Group justify="space-between" key={`nd-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <YesNoSelect
                        onChange={(val) =>
                            filter.onChange(val === 'yes' ? true : val === 'no' ? false : undefined)
                        }
                        size="xs"
                        value={filter.value}
                    />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    defaultValue={filter?.minYear}
                    hideControls={false}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => handleMinYearFilter(e)}
                    required={!!filter?.maxYear}
                />
                <NumberInput
                    defaultValue={filter?.maxYear}
                    hideControls={false}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={(e) => handleMaxYearFilter(e)}
                    required={!!filter?.minYear}
                />
            </Group>
            <Group grow>
                <MultiSelectWithInvalidData
                    clearable
                    data={genreList}
                    defaultValue={filter.genres}
                    label={t('entity.genre', { count: 2, postProcess: 'sentenceCase' })}
                    onChange={handleGenresFilter}
                    searchable
                />
            </Group>

            <Group grow>
                <MultiSelectWithInvalidData
                    clearable
                    data={selectableAlbumArtists}
                    defaultValue={filter?._custom?.emby?.AlbumArtistIds?.split(',')}
                    disabled={disableArtistFilter}
                    label={t('entity.artist', { count: 2, postProcess: 'sentenceCase' })}
                    limit={300}
                    onChange={handleAlbumArtistFilter}
                    onSearchChange={setAlbumArtistSearchTerm}
                    placeholder="Type to search for an artist"
                    rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                    searchable
                    searchValue={albumArtistSearchTerm}
                />
            </Group>
            {tagsQuery.data?.boolTags && tagsQuery.data.boolTags.length > 0 && (
                <Group grow>
                    <MultiSelectWithInvalidData
                        clearable
                        data={tagsQuery.data.boolTags}
                        defaultValue={selectedTags}
                        label={t('common.tags', { postProcess: 'sentenceCase' })}
                        onChange={handleTagFilter}
                        searchable
                        width={250}
                    />
                </Group>
            )}
        </Stack>
    );
};
