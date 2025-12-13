import { Spoiler as MantineSpoiler, SpoilerProps as MantineSpoilerProps } from '@mantine/core';
import { ReactNode, useState } from 'react';

import styles from './spoiler.module.css';

import { Icon } from '/@/shared/components/icon/icon';

interface SpoilerProps extends MantineSpoilerProps {
    children?: ReactNode;
}

export const Spoiler = ({ children, ...props }: SpoilerProps) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <MantineSpoiler
            classNames={{ content: styles.spoiler, control: styles.control }}
            expanded={expanded}
            {...props}
            hideLabel={<Icon icon="arrowUpS" size="lg" />}
            onClick={() => setExpanded(!expanded)}
            showLabel={<Icon icon="arrowDownS" size="lg" />}
        >
            {children}
        </MantineSpoiler>
    );
};
