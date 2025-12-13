import { matchPath } from 'react-router';

import { AppRoute } from '/@/renderer/router/routes';

export const getRoutePattern = (pathname: string): string => {
    const routePatterns = Object.values(AppRoute);

    const sortedRoutes = routePatterns.sort((a, b) => b.split('/').length - a.split('/').length);

    for (const pattern of sortedRoutes) {
        const match = matchPath(
            {
                caseSensitive: false,
                end: true,
                path: pattern,
            },
            pathname,
        );

        if (match) {
            return pattern;
        }
    }

    // Fallback to the default route if no pattern matches
    return '/';
};
