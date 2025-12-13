import { useCallback, useMemo, useState } from 'react';

import { useIsPlayerFetching } from '/@/renderer/features/player/context/player-context';
import { useLongPress } from '/@/shared/hooks/use-long-press';

interface UsePlayButtonClickOptions {
    disabled?: boolean;
    loading?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onLongPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

interface UsePlayButtonClickReturn {
    handlers: {
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
        onMouseLeave: (e: React.MouseEvent) => void;
        onMouseUp: (e: React.MouseEvent) => void;
        onTouchCancel: (e: React.TouchEvent) => void;
        onTouchEnd: (e: React.TouchEvent) => void;
        onTouchStart: (e: React.TouchEvent) => void;
    };
    props: {
        'data-pressing'?: string;
        disabled: boolean;
        style: React.CSSProperties;
    };
}

export const usePlayButtonClick = ({
    loading,
    onClick,
    onLongPress,
}: UsePlayButtonClickOptions): UsePlayButtonClickReturn => {
    const isPlayerFetching = useIsPlayerFetching();
    const isDisabled = Boolean(isPlayerFetching || loading);
    const [isPressing, setIsPressing] = useState(false);
    const [isLongPressing, setIsLongPressing] = useState(false);

    const longPressHandlers = useLongPress<HTMLButtonElement>({
        onClick: (e) => {
            if (isDisabled || loading) {
                return;
            }

            e.stopPropagation();
            e.preventDefault();
            onClick?.(e as React.MouseEvent<HTMLButtonElement>);
        },
        onFinish: () => {
            setIsPressing(false);
            setIsLongPressing(false);
        },
        onLongPress: (e) => {
            if (isDisabled || loading) {
                return;
            }

            e.stopPropagation();
            e.preventDefault();
            setIsPressing(false);
            setIsLongPressing(true);
            onLongPress?.(e as React.MouseEvent<HTMLButtonElement>);
        },
        onStart: () => {
            if (!isDisabled && !loading) {
                setIsPressing(true);
                setIsLongPressing(false);
            }
        },
    });

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            longPressHandlers.onMouseDown?.(e);
        },
        [longPressHandlers],
    );

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
    }, []);

    const handlers = useMemo(
        () => ({
            onClick: handleClick,
            onMouseDown: handleMouseDown,
            onMouseLeave: longPressHandlers.onMouseLeave,
            onMouseUp: longPressHandlers.onMouseUp,
            onTouchCancel: longPressHandlers.onTouchCancel,
            onTouchEnd: longPressHandlers.onTouchEnd,
            onTouchStart: longPressHandlers.onTouchStart,
        }),
        [
            handleClick,
            handleMouseDown,
            longPressHandlers.onMouseLeave,
            longPressHandlers.onMouseUp,
            longPressHandlers.onTouchCancel,
            longPressHandlers.onTouchEnd,
            longPressHandlers.onTouchStart,
        ],
    );

    const props = useMemo(() => {
        return {
            'data-pressing': isPressing ? 'true' : undefined,
            disabled: isDisabled,
            style: {
                '--long-press-duration': '300ms',
                '--play-button-scale': isLongPressing ? 1.15 : 1,
                opacity: isDisabled ? 0.5 : 1,
                transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
            } as React.CSSProperties,
        };
    }, [isDisabled, isPressing, isLongPressing]);

    return { handlers, props };
};
