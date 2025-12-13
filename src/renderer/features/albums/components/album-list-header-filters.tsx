import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ALBUM_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { useListContext } from '/@/renderer/context/list-context';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { ListDisplayTypeToggleButton } from '/@/renderer/features/shared/components/list-display-type-toggle-button';
import { ListFiltersModal } from '/@/renderer/features/shared/components/list-filters';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { GenreTarget, useGenreTarget, useSettingsStoreActions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { AlbumListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const AlbumListHeaderFilters = ({ toggleGenreTarget }: { toggleGenreTarget?: boolean }) => {
    const { t } = useTranslation();
    const target = useGenreTarget();
    const { setGenreBehavior } = useSettingsStoreActions();
    const albumFilters = useAlbumListFilters();
    const songFilters = useSongListFilters();

    const { pageKey } = useListContext();

    const choice = useMemo(() => {
        return target === GenreTarget.ALBUM
            ? t('entity.album_other', { postProcess: 'titleCase' })
            : t('entity.track_other', { postProcess: 'titleCase' });
    }, [target, t]);

    const handleToggleGenreTarget = useCallback(() => {
        // Clear all filter query states
        albumFilters.clear();
        songFilters.clear();

        // Toggle the genre target
        setGenreBehavior(target === GenreTarget.ALBUM ? GenreTarget.TRACK : GenreTarget.ALBUM);
    }, [target, setGenreBehavior, albumFilters, songFilters]);

    return (
        <Flex justify="space-between">
            <Group gap="sm" w="100%">
                {toggleGenreTarget && (
                    <>
                        <Button
                            leftSection={<Icon icon="arrowLeftRight" />}
                            onClick={handleToggleGenreTarget}
                            variant="subtle"
                        >
                            {choice}
                        </Button>
                        <Divider orientation="vertical" />
                    </>
                )}
                <ListSortByDropdown
                    defaultSortByValue={AlbumListSort.NAME}
                    itemType={LibraryItem.ALBUM}
                    listKey={pageKey as ItemListKey}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    listKey={pageKey as ItemListKey}
                />
                <ListFiltersModal itemType={LibraryItem.ALBUM} />
                <ListRefreshButton listKey={pageKey as ItemListKey} />
            </Group>
            <Group gap="sm" wrap="nowrap">
                <ListDisplayTypeToggleButton listKey={ItemListKey.ALBUM} />
                <ListConfigMenu
                    listKey={ItemListKey.ALBUM}
                    tableColumnsData={ALBUM_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
