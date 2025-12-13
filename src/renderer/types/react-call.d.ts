declare module 'react-call' {
    export function createCallable<Props, Result>(
        component: (props: Props & { call: (result: Result) => void }) => React.ReactNode,
    ): {
        (props: Props): Promise<Result>;
        Root: React.FC;
    };
}
