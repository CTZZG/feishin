import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { useIsMutatingRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { Rating } from '/@/shared/components/rating/rating';

export const RatingColumn = (props: ItemTableListInnerColumn) => {
    const row: null | number | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];

    const isMutatingRating = useIsMutatingRating();

    if (typeof row === 'number' || row === null) {
        return (
            <TableColumnContainer {...props}>
                <Rating
                    className={row ? undefined : 'hover-only-flex'}
                    onChange={(rating) => {
                        const item = props.data[props.rowIndex] as ItemListItem;
                        const rowId = props.internalState.extractRowId(item);
                        const index = rowId ? props.internalState.findItemIndex(rowId) : -1;
                        props.controls.onRating?.({
                            event: null,
                            index,
                            internalState: props.internalState,
                            item,
                            itemType: props.itemType,
                            rating,
                        });
                    }}
                    readOnly={isMutatingRating}
                    size="xs"
                    value={row || 0}
                />
            </TableColumnContainer>
        );
    }

    return <TableColumnContainer {...props}>&nbsp;</TableColumnContainer>;
};
