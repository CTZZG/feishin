import clsx from 'clsx';
import {
    ForwardedRef,
    forwardRef,
    HTMLAttributes,
    type ImgHTMLAttributes,
    memo,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';

import styles from './image.module.css';
import { useNativeImage } from './use-native-image';

import { AppIcon, Icon } from '/@/shared/components/icon/icon';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { useInViewport } from '/@/shared/hooks/use-in-viewport';
import { ImageRequest } from '/@/shared/types/domain-types';

const FAILED_IMAGE_CACHE_TTL_MS = 60 * 1000;

const loadedImageCacheKeys = new Set<string>();
const failedImageCacheKeys = new Map<string, number>();

const getImageRequestFailureKey = (request: ImageRequest | undefined) => {
    if (!request) {
        return null;
    }

    return JSON.stringify({
        cacheKey: request.cacheKey,
        credentials: request.credentials,
        headers: request.headers,
        url: request.url,
    });
};

const hasRecentImageFailure = (failureKey: null | string) => {
    if (!failureKey) {
        return false;
    }

    const failedAt = failedImageCacheKeys.get(failureKey);

    if (!failedAt) {
        return false;
    }

    if (Date.now() - failedAt > FAILED_IMAGE_CACHE_TTL_MS) {
        failedImageCacheKeys.delete(failureKey);
        return false;
    }

    return true;
};

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    containerClassName?: string;
    enableAnimation?: boolean;
    enableDebounce?: boolean;
    enableViewport?: boolean;
    fetchPriority?: 'auto' | 'high' | 'low';
    imageContainerProps?: Omit<ImageContainerProps, 'children'>;
    imageRequest?: ImageRequest;
    includeLoader?: boolean;
    includeUnloader?: boolean;
    isExplicit?: boolean;
    src: string | undefined;
    unloaderIcon?: keyof typeof AppIcon;
}

interface ImageContainerProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    isExplicit?: boolean;
}

interface ImageLoaderProps {
    className?: string;
}

interface ImageUnloaderProps {
    className?: string;
    icon?: keyof typeof AppIcon;
}

export const FALLBACK_SVG =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1IiBkPSJNMCAwaDMwMHYzMDBIMHoiLz48L3N2Zz4=';

export function BaseImage({
    className,
    containerClassName,
    enableAnimation = false,
    enableDebounce = false,
    enableViewport = true,
    fetchPriority = 'low',
    imageContainerProps,
    imageRequest,
    includeLoader = true,
    includeUnloader = true,
    isExplicit = false,
    onError,
    onLoad,
    src,
    unloaderIcon = 'emptyImage',
    ...props
}: ImageProps) {
    const viewport = useInViewport();
    const { inViewport, ref } = enableViewport ? viewport : { inViewport: true, ref: undefined };
    const { className: containerPropsClassName, ...restContainerProps } = imageContainerProps || {};

    const rawImageRequest = useMemo(
        () => imageRequest ?? (src ? { cacheKey: src, url: src } : undefined),
        [imageRequest, src],
    );
    const rawImageFailureKey = useMemo(
        () => getImageRequestFailureKey(rawImageRequest),
        [rawImageRequest],
    );
    const isInSessionCache = Boolean(
        rawImageRequest?.cacheKey && loadedImageCacheKeys.has(rawImageRequest.cacheKey),
    );
    const isKnownFailed = hasRecentImageFailure(rawImageFailureKey);
    const [debouncedImageRequest] = useDebouncedValue(rawImageRequest, 100, {
        waitForInitial: true,
    });
    const effectiveImageRequest =
        isInSessionCache || !enableDebounce ? rawImageRequest : debouncedImageRequest;
    const effectiveImageFailureKey = useMemo(
        () => getImageRequestFailureKey(effectiveImageRequest),
        [effectiveImageRequest],
    );

    const [hasLoadedInInstance, setHasLoadedInInstance] = useState(false);

    useEffect(() => {
        setHasLoadedInInstance(false);
    }, [effectiveImageRequest?.cacheKey]);

    const shouldLoadImage = Boolean(
        effectiveImageRequest &&
        !isKnownFailed &&
        (!enableViewport || isInSessionCache || inViewport || hasLoadedInInstance),
    );

    const nativeImage = useNativeImage({
        enabled: shouldLoadImage,
        fetchPriority,
        onFetchError: src
            ? () => {
                  (onError as ((event: undefined) => void) | undefined)?.(undefined);
              }
            : undefined,
        request: effectiveImageRequest,
    });

    useEffect(() => {
        if (!nativeImage.isLoaded || !effectiveImageRequest?.cacheKey) {
            return;
        }

        loadedImageCacheKeys.add(effectiveImageRequest.cacheKey);
        if (effectiveImageFailureKey) {
            failedImageCacheKeys.delete(effectiveImageFailureKey);
        }
        setHasLoadedInInstance(true);
    }, [effectiveImageFailureKey, effectiveImageRequest?.cacheKey, nativeImage.isLoaded]);

    useEffect(() => {
        if (!nativeImage.isError || !effectiveImageFailureKey) {
            return;
        }

        failedImageCacheKeys.set(effectiveImageFailureKey, Date.now());
    }, [effectiveImageFailureKey, nativeImage.isError]);

    return (
        <ImageContainer
            className={clsx(containerClassName, containerPropsClassName)}
            isExplicit={isExplicit}
            ref={ref}
            {...restContainerProps}
        >
            {nativeImage.displaySrc ? (
                <img
                    className={clsx(styles.image, className, {
                        [styles.animated]: enableAnimation,
                    })}
                    decoding="async"
                    fetchPriority={fetchPriority}
                    onError={onError}
                    onLoad={onLoad}
                    src={nativeImage.displaySrc}
                    {...props}
                />
            ) : !src ? (
                <ImageUnloader className={className} icon={unloaderIcon} />
            ) : nativeImage.isError || isKnownFailed ? (
                includeUnloader ? (
                    <ImageUnloader className={className} icon={unloaderIcon} />
                ) : null
            ) : includeLoader ? (
                <ImageLoader className={className} />
            ) : null}
        </ImageContainer>
    );
}

export const Image = memo(BaseImage);

const ImageContainer = forwardRef(
    (
        { children, className, isExplicit, ...props }: ImageContainerProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        return (
            <div
                className={clsx(styles.imageContainer, className, {
                    [styles.censored]: isExplicit,
                })}
                ref={ref}
                {...props}
            >
                {children}
            </div>
        );
    },
);

export function ImageLoader({ className }: ImageLoaderProps) {
    return (
        <Skeleton
            className={clsx(styles.skeleton, styles.loader, className)}
            containerClassName={styles.skeletonContainer}
        />
    );
}

export function ImageUnloader({ className, icon = 'emptyImage' }: ImageUnloaderProps) {
    return (
        <div className={clsx(styles.unloader, className)}>
            <Icon color="default" icon={icon} size="25%" />
        </div>
    );
}
