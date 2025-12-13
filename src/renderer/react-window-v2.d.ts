declare module 'react-window-v2' {
    export * from 'react-window';
    import { GridChildComponentProps } from 'react-window';
    export type CellComponentProps<T = any> = GridChildComponentProps<T>;
}
