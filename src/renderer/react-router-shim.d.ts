declare module 'react-router' {
    export * from 'react-router/dist/lib/index'; // Try to re-export if possible, or just declare what we need
    export const Link: any;
    export const useSearchParams: any;
    export const createSearchParams: any;
    // Add others if needed
}
