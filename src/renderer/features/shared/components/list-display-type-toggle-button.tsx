import { DisplayTypeToggleButton } from '/@/renderer/features/shared/components/display-type-toggle-button';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

interface ListDisplayTypeToggleButtonProps {
    listKey: ItemListKey;
}

export const ListDisplayTypeToggleButton = ({ listKey }: ListDisplayTypeToggleButtonProps) => {
    const displayType = useSettingsStore(
        (state) => state.lists[listKey]?.display,
    ) as ListDisplayType;
    const { setList } = useSettingsStoreActions();

    const handleToggleDisplayType = () => {
        const newDisplayType =
            displayType === ListDisplayType.GRID ? ListDisplayType.TABLE : ListDisplayType.GRID;
        setList(listKey, {
            display: newDisplayType,
        });
    };

    return <DisplayTypeToggleButton displayType={displayType} onToggle={handleToggleDisplayType} />;
};
