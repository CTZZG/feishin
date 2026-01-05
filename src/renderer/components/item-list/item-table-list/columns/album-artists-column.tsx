import clsx from 'clsx';
import { memo } from 'react';

import styles from './album-artists-column.module.css';

import {
    ColumnNullFallback,
    ColumnSkeletonVariable,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { JoinedArtists } from '/@/renderer/features/albums/components/joined-artists';
import { Album, RelatedAlbumArtist, Song } from '/@/shared/types/domain-types';

const AlbumArtistsColumn = (props: ItemTableListInnerColumn) => {
    const row: RelatedAlbumArtist[] | undefined = (props.data as any[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    const item = props.data[props.rowIndex] as Album | Song | undefined;
    const albumArtistString = item && 'albumArtistName' in item ? item.albumArtistName : '';

    if (Array.isArray(row)) {
        return (
            <TableColumnContainer {...props}>
                <div
                    className={clsx(styles.artistsContainer, {
                        [styles.compact]: props.size === 'compact',
                        [styles.large]: props.size === 'large',
                    })}
                >
                    <JoinedArtists
                        artistName={albumArtistString}
                        artists={row}
                        linkProps={{ fw: 400, isMuted: true }}
                        rootTextProps={{
                            className: clsx(styles.artistsContainer, {
                                [styles.compact]: props.size === 'compact',
                                [styles.large]: props.size === 'large',
                            }),
                            fw: 400,
                            isMuted: true,
                            size: 'sm',
                        }}
                    />
                </div>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
};

export const AlbumArtistsColumnMemo = memo(AlbumArtistsColumn);

export { AlbumArtistsColumnMemo as AlbumArtistsColumn };
