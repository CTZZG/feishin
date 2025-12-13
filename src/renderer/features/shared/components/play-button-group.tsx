import styles from './play-button-group.module.css';

import i18n from '/@/i18n/i18n';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { AppIconSelection } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { Play } from '/@/shared/types/types';

const playButtons: {
    icon: AppIconSelection;
    label: React.ReactNode | string;
    secondary: boolean;
    type: Play;
}[] = [
    {
        icon: 'mediaPlayNext',
        label: (
            <Stack gap="xs" justify="center">
                <Text fw={500} ta="center">
                    {i18n.t('player.addNext', { postProcess: 'sentenceCase' }) as string}
                </Text>
                <Text fw={500} isMuted size="xs" ta="center">
                    {i18n.t('player.holdToShuffle', { postProcess: 'sentenceCase' }) as string}
                </Text>
            </Stack>
        ),

        secondary: true,
        type: Play.NEXT,
    },
    {
        icon: 'mediaPlay',
        label: (
            <Stack gap="xs" justify="center">
                <Text fw={500} ta="center">
                    {i18n.t('player.play', { postProcess: 'sentenceCase' }) as string}
                </Text>
                <Text fw={500} isMuted size="xs" ta="center">
                    {i18n.t('player.holdToShuffle', { postProcess: 'sentenceCase' }) as string}
                </Text>
            </Stack>
        ),
        secondary: false,
        type: Play.NOW,
    },
    {
        icon: 'mediaPlayLast',
        label: (
            <Stack gap="xs" justify="center">
                <Text fw={500} ta="center">
                    {i18n.t('player.addLast', { postProcess: 'sentenceCase' }) as string}
                </Text>
                <Text fw={500} isMuted size="xs" ta="center">
                    {i18n.t('player.holdToShuffle', { postProcess: 'sentenceCase' }) as string}
                </Text>
            </Stack>
        ),
        secondary: true,
        type: Play.LAST,
    },
];

export const LONG_PRESS_PLAY_BEHAVIOR = {
    [Play.LAST]: Play.LAST_SHUFFLE,
    [Play.NEXT]: Play.NEXT_SHUFFLE,
    [Play.NOW]: Play.SHUFFLE,
};

const PLAY_BEHAVIOR_TO_LABEL = {
    [Play.LAST]: i18n.t('player.addLast', { postProcess: 'sentenceCase' }) as string,
    [Play.NEXT]: i18n.t('player.addNext', { postProcess: 'sentenceCase' }) as string,
    [Play.NOW]: i18n.t('player.play', { postProcess: 'sentenceCase' }) as string,
};

const TooltipLabel = ({ label }: { label: React.ReactNode | string; type: Play }) => {
    return (
        <Stack gap="xs" justify="center">
            <Text fw={500} ta="center">
                {label}
            </Text>
            <Text fw={500} isMuted size="xs" ta="center">
                {i18n.t('player.holdToShuffle', { postProcess: 'sentenceCase' }) as string}
            </Text>
        </Stack>
    );
};

export const PlayTooltip = ({
    children,
    disabled,
    type,
}: {
    children: React.ReactNode;
    disabled?: boolean;
    type: Play;
}) => {
    return (
        <Tooltip
            disabled={disabled}
            label={<TooltipLabel label={PLAY_BEHAVIOR_TO_LABEL[type]} type={type} />}
        >
            {children}
        </Tooltip>
    );
};

interface PlayButtonGroupProps {
    loading?: boolean | Play;
    onPlay: (type: Play) => void;
}

export const PlayButtonGroup = ({ loading, onPlay }: PlayButtonGroupProps) => {
    return (
        <div className={styles.playButtonGroup}>
            <Tooltip.Group>
                {playButtons.map((button) => (
                    <Tooltip key={button.type} label={button.label}>
                        <PlayButton
                            fill={button.type === Play.NOW}
                            icon={button.icon}
                            isSecondary={button.secondary}
                            loading={loading === button.type}
                            onClick={() => onPlay(button.type)}
                            onLongPress={() => onPlay(LONG_PRESS_PLAY_BEHAVIOR[button.type])}
                        />
                    </Tooltip>
                ))}
            </Tooltip.Group>
        </div>
    );
};
