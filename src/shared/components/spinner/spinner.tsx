import { Center } from '@mantine/core';
import { IconBaseProps } from 'react-icons';
import { CgSpinnerTwo } from 'react-icons/cg';

import styles from './spinner.module.css';

interface SpinnerProps extends IconBaseProps {
    color?: string;
    container?: boolean;
    size?: number;
}

export const SpinnerIcon = CgSpinnerTwo;

export const Spinner = ({ ...props }: SpinnerProps) => {
    if (props.container) {
        return (
            <Center className={styles.container}>
                <SpinnerIcon className={styles.icon} color={props.color} size={props.size} />
            </Center>
        );
    }

    return <SpinnerIcon className={styles.icon} color={props.color} size={props.size} />;
};
