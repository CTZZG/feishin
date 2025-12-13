/* eslint-disable */
declare module 'react-router' {
    export const useNavigate: any;
    export const useParams: any;
    export const useLocation: any;
    export const useMatch: any;
    export const matchPath: any;
    export const generatePath: any;
    export const Navigate: any;
    export const Outlet: any;
    export const HashRouter: any;
    export const Route: any;
    export const Routes: any;
    export const Link: any;
    export const NavLink: any;
    export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
        [key: string]: any;
        replace?: boolean;
        state?: any;
        to: any;
    }
    export const useRouteError: any;
}

declare module '@tanstack/react-query' {
    export type MutationOptions<T = any, K = any, U = any, V = any> = any;
    export type QueryOptions<T = any, K = any, U = any, V = any> = any;
    export type UseMutationOptions<T = any, K = any, U = any, V = any> = any;
    export type UseQueryOptions<T = any, K = any, U = any, V = any> = any;
    export type UseSuspenseQueryOptions<T = any, K = any, U = any, V = any> = any;
    export const useQuery: <
        TQueryFnData = any,
        TError = any,
        TData = TQueryFnData,
        TQueryKey = any,
    >(
        options: any,
    ) => any;
    export const useMutation: <TData = any, TError = any, TVariables = any, TContext = any>(
        options: any,
    ) => any;
    export const useQueryClient: () => any;
    export const QueryClient: any;
    export const useSuspenseQuery: <
        TQueryFnData = any,
        TError = any,
        TData = TQueryFnData,
        TQueryKey = any,
    >(
        options: any,
    ) => any;
    export const useSuspenseInfiniteQuery: <
        TQueryFnData = any,
        TError = any,
        TData = TQueryFnData,
        TQueryKey = any,
    >(
        options: any,
    ) => any;
    export const queryOptions: (options: any) => any;
    export const mutationOptions: (options: any) => any;
    export type DefaultOptions<T = any> = any;
    export const QueryCache: any;
    export type QueryFunctionContext<T = any, K = any> = any;
    export type UseInfiniteQueryOptions<T = any, K = any, U = any, V = any> = any;
    export type UseMutationResult<T = any, K = any, U = any, V = any> = any;
    export type UseQueryResult<T = any, K = any> = any;
    export const useIsMutating: any;
    export const useIsFetching: any;
}

declare module 'react-window-v2' {
    export const Grid: any;
    export const List: any;
    export type CellComponentProps<T = any> = {
        [key: string]: any;
        columnIndex: number;
        data: T;
        isScrolling?: boolean;
        rowIndex: number;
        style: React.CSSProperties;
    };
    export type RowComponentProps<T = any> = {
        [key: string]: any;
        data: T;
        index: number;
        isScrolling?: boolean;
        style: React.CSSProperties;
    };
}

declare module 'wavesurfer.js' {
    const WaveSurfer: any;
    export default WaveSurfer;
}

declare module '@wavesurfer/react' {
    export const useWavesurfer: any;
}

declare module 'fuse.js' {
    namespace Fuse {
        export type FuseResultMatch = any;
        /* eslint-disable @typescript-eslint/no-unused-vars */
        /// <reference types="vite/client" />
        interface IFuseOptions<T> {
            [key: string]: any;
        }
    }
    export type FuseResultMatch = any;
    class Fuse<T> {
        constructor(list: T[], options?: Fuse.IFuseOptions<T>);
        search(pattern: string): any[];
    }
    export default Fuse;
}

declare module '@radix-ui/react-context-menu' {
    export const Root: any;
    export const Trigger: any;
    export const Portal: any;
    export const Content: any;
    export const Item: any;
    export const CheckboxItem: any;
    export const RadioItem: any;
    export const Label: any;
    export const Separator: any;
    export const Sub: any;
    export const SubTrigger: any;
    export const SubContent: any;
    export const Group: any;
    export const Arrow: any;
    export const ContextMenu: any;
    export const ContextMenuTrigger: any;
    export const ContextMenuContent: any;
    export const ContextMenuItem: any;
    export const ContextMenuCheckboxItem: any;
    export const ContextMenuRadioItem: any;
    export const ContextMenuLabel: any;
    export const ContextMenuSeparator: any;
    export const ContextMenuSub: any;
    export const ContextMenuSubTrigger: any;
    export const ContextMenuSubContent: any;
    export const ContextMenuGroup: any;
    export const ContextMenuPortal: any;
}

declare module 'string-to-color' {
    const stringToColor: (str: any) => string;
    export default stringToColor;
}
