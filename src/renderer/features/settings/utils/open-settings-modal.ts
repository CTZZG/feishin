import { openContextModal } from '@mantine/modals';

export const openSettingsModal = () => {
    openContextModal({
        innerProps: {},
        modalKey: 'settings',
        overlayProps: {
            opacity: 1,
        },
        size: '2xl',
        styles: {
            content: {
                height: '100%',
                maxWidth: 'var(--theme-content-max-width)',
                width: '100%',
            },
        },
        transitionProps: {
            transition: 'pop',
        },
    });
};
