import { closeAllModals, openModal } from '@mantine/modals';
import { CSSProperties, memo, ReactNode, useCallback } from 'react';

import styles from './library-header-bar.module.css';

import { useIsPlayerFetching, usePlayer } from '/@/renderer/features/player/context/player-context';
import { DefaultPlayButton } from '/@/renderer/features/shared/components/play-button';
import { PlayButtonGroup } from '/@/renderer/features/shared/components/play-button-group';
import { useCurrentServerId } from '/@/renderer/store';
import { Badge, BadgeProps } from '/@/shared/components/badge/badge';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface LibraryHeaderBarProps {
    children: ReactNode;
    ignoreMaxWidth?: boolean;
}

const LibraryHeaderBarComponent = ({ children, ignoreMaxWidth }: LibraryHeaderBarProps) => {
    return (
        <div
            className={styles.headerContainer}
            style={ignoreMaxWidth ? ({ maxWidth: 'none' } as CSSProperties) : undefined}
        >
            {children}
        </div>
    );
};

interface HeaderPlayButtonProps {
    className?: string;
    ids?: string[];
    itemType: LibraryItem;
    listQuery?: Record<string, any>;
    songs?: Song[];
    variant?: 'default' | 'filled';
}

interface TitleProps {
    children: ReactNode;
}

const HeaderPlayButton = ({
    className,
    ids,
    itemType,
    listQuery,
    songs,
    variant = 'filled',
    ...props
}: HeaderPlayButtonProps) => {
    const serverId = useCurrentServerId();
    const player = usePlayer();

    const handlePlay = useCallback(
        (playType: Play) => {
            if (listQuery) {
                player.addToQueueByListQuery(serverId, listQuery, itemType, playType);
            } else if (ids) {
                player.addToQueueByFetch(serverId, ids, itemType, playType);
            } else if (songs) {
                player.addToQueueByData(songs, playType);
            }

            closeAllModals();
        },
        [listQuery, ids, songs, player, serverId, itemType],
    );

    const openPlayTypeModal = useCallback(() => {
        if (!serverId) return;

        openModal({
            children: <PlayButtonGroup onPlay={handlePlay} />,
            size: 'xs',
            styles: {
                body: {
                    padding: 'var(--theme-spacing-md)',
                },
                header: {
                    display: 'none',
                },
            },
        });
    }, [serverId, handlePlay]);

    const isPlayerFetching = useIsPlayerFetching();

    return (
        <div className={styles.playButtonContainer}>
            <DefaultPlayButton
                className={className}
                loading={isPlayerFetching}
                onClick={openPlayTypeModal}
                variant={variant}
                {...props}
            />
        </div>
    );
};

const Title = ({ children }: TitleProps) => {
    return (
        <TextTitle fw={700} order={1} overflow="hidden">
            {children}
        </TextTitle>
    );
};

interface HeaderBadgeProps extends BadgeProps {
    isLoading?: boolean;
}

const HeaderBadge = ({ children, isLoading, ...props }: HeaderBadgeProps) => {
    return <Badge {...props}>{isLoading ? <Spinner /> : children}</Badge>;
};

export const LibraryHeaderBar = Object.assign(memo(LibraryHeaderBarComponent), {
    Badge: HeaderBadge,
    PlayButton: HeaderPlayButton,
    Title,
});
