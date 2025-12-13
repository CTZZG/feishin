import { mutationOptions, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';

dayjs.extend(utc);

import packageJson from '../../../../../package.json';

import { isAnalyticsDisabled } from '/@/renderer/features/analytics/hooks/use-analytics-disabled';
import { useAuthStore } from '/@/renderer/store';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { ServerType } from '/@/shared/types/domain-types';
import { Platform } from '/@/shared/types/types';

const utils = isElectron() ? window.api.utils : null;

const getVersion = (): AppTrackerProperties['_version'] => {
    return packageJson.version;
};

const getPlatform = (): AppTrackerProperties['_platform'] => {
    if (!isElectron()) {
        return Platform.WEB;
    }

    if (utils?.isWindows()) {
        return Platform.WINDOWS;
    }

    if (utils?.isMacOS()) {
        return Platform.MACOS;
    }

    if (utils?.isLinux()) {
        return Platform.LINUX;
    }

    return 'unknown';
};

type AppTrackerProperties = {
    _platform: 'unknown' | Platform;
    _version: string;
    // player: {
    //     mediaSession: boolean;
    //     playerQueueType: PlayerQueueType;
    //     playerStyle: PlayerStyle;
    //     playerType: PlayerType;
    //     transcoding: boolean;
    //     webAudio: boolean;
    // };
    server: {
        [ServerType.JELLYFIN]?: boolean;
        [ServerType.NAVIDROME]?: boolean;
        [ServerType.SUBSONIC]?: boolean;
    };
    // settings: {
    //     albumBackground: boolean;
    //     albumBackgroundBlur: number;
    //     artistBackground: boolean;
    //     artistBackgroundBlur: number;
    //     customCss: boolean;
    //     disableAutoUpdate: boolean;
    //     discord: boolean;
    //     exitToTray: boolean;
    //     fontType: FontType;
    //     globalHotkeys: boolean;
    //     homeFeature: boolean;
    //     language: string;
    //     lastFM: boolean;
    //     lyricsEnableAutoTranslation: boolean;
    //     lyricsEnableNeteaseTranslation: boolean;
    //     lyricsFetch: boolean;
    //     minimizeToTray: boolean;
    //     musicBrainz: boolean;
    //     nativeAspectRatio: boolean;
    //     playerbarSliderType: PlayerbarSliderType;
    //     playerbarWaveformAlign: BarAlign;
    //     playerbarWaveformBarWidth: number;
    //     playerbarWaveformGap: number;
    //     playerbarWaveformRadius: number;
    //     preventSleepOnPlayback: boolean;
    //     releaseChannel: string;
    //     resume: boolean;
    //     scrobbleEnabled: boolean;
    //     sideQueueType: SideQueueType;
    //     skipBackwardSeconds: number;
    //     skipButtons: boolean;
    //     skipForwardSeconds: number;
    //     startMinimized: boolean;
    //     theme: string;
    //     tray: boolean;
    //     windowBarStyle: Platform;
    //     zoomFactor: number;
    // };
};

// const getPlayerProperties = (): AppTrackerProperties['player'] => {
//     const player = usePlayerStore.getState();
//     const playbackSettings = useSettingsStore.getState().playback;

//     return {
//         mediaSession: playbackSettings.mediaSession,
//         playerQueueType: player.player.queueType,
//         playerStyle: player.player.transitionType,
//         playerType: playbackSettings.type,
//         transcoding: playbackSettings.transcode.enabled,
//         webAudio: playbackSettings.webAudio,
//     };
// };

// const getSettingsProperties = (): AppTrackerProperties['settings'] => {
//     const settings = useSettingsStore.getState();

//     return {
//         albumBackground: settings.general.albumBackground,
//         albumBackgroundBlur: settings.general.albumBackgroundBlur,
//         artistBackground: settings.general.artistBackground,
//         artistBackgroundBlur: settings.general.artistBackgroundBlur,
//         customCss: settings.css.enabled,
//         disableAutoUpdate: settings.window.disableAutoUpdate,
//         discord: settings.discord.enabled,
//         exitToTray: settings.window.exitToTray,
//         fontType: settings.font.type,
//         globalHotkeys: settings.hotkeys.globalMediaHotkeys,
//         homeFeature: settings.general.homeFeature,
//         language: settings.general.language,
//         lastFM: settings.general.lastFM,
//         lyricsEnableAutoTranslation: settings.lyrics.enableAutoTranslation,
//         lyricsEnableNeteaseTranslation: settings.lyrics.enableNeteaseTranslation,
//         lyricsFetch: settings.lyrics.fetch,
//         minimizeToTray: settings.window.minimizeToTray,
//         musicBrainz: settings.general.musicBrainz,
//         nativeAspectRatio: settings.general.nativeAspectRatio,
//         playerbarSliderType: settings.general.playerbarSlider.type as PlayerbarSliderType,
//         playerbarWaveformAlign: settings.general.playerbarSlider.barAlign as BarAlign,
//         playerbarWaveformBarWidth: settings.general.playerbarSlider.barWidth,
//         playerbarWaveformGap: settings.general.playerbarSlider.barGap,
//         playerbarWaveformRadius: settings.general.playerbarSlider.barRadius,
//         preventSleepOnPlayback: settings.window.preventSleepOnPlayback,
//         releaseChannel: settings.window.releaseChannel,
//         resume: settings.general.resume,
//         scrobbleEnabled: settings.playback.scrobble.enabled,
//         sideQueueType: settings.general.sideQueueType,
//         skipBackwardSeconds: settings.general.skipButtons.skipBackwardSeconds,
//         skipButtons: settings.general.skipButtons.enabled,
//         skipForwardSeconds: settings.general.skipButtons.skipForwardSeconds,
//         startMinimized: settings.window.startMinimized,
//         theme: settings.general.theme,
//         tray: settings.window.tray,
//         windowBarStyle: settings.window.windowBarStyle,
//         zoomFactor: settings.general.zoomFactor,
//     };
// };

const getServerProperties = (): AppTrackerProperties['server'] => {
    const auth = useAuthStore.getState();
    const serverList = auth.serverList;

    const properties: AppTrackerProperties['server'] = {};

    Object.values(serverList).forEach((server) => {
        properties[server.type] = true;
    });

    return properties;
};

export const useAppTracker = () => {
    const { mutate: trackAppMutation } = useMutation(appTrackerMutation);
    const isTrackingInProgressRef = useRef(false);
    const hasRunOnMountRef = useRef(false);

    useEffect(() => {
        if (!window.umami || isAnalyticsDisabled()) {
            return;
        }

        const getProperties = () => {
            const platform = getPlatform();
            const version = getVersion();
            const serverProperties = getServerProperties();
            // const playerProperties = getPlayerProperties();
            // const settingsProperties = getSettingsProperties();

            const properties: AppTrackerProperties = {
                _platform: platform,
                _version: version,
                server: serverProperties,
                // player: playerProperties,
                // settings: settingsProperties,
            };

            return properties;
        };

        const checkAndTrack = () => {
            // Prevent multiple simultaneous requests
            if (isTrackingInProgressRef.current) {
                return;
            }

            const lastSentDate = localStorage.getItem('analytics_app_tracker_timestamp');
            const todayUTC = dayjs.utc().format('YYYY-MM-DD');

            // Only send if it's a new day in UTC (ensures once per 24 hours)
            if (lastSentDate !== todayUTC) {
                isTrackingInProgressRef.current = true;
                const properties = getProperties();

                trackAppMutation(properties, {
                    onError: () => {},
                    onSettled: () => {
                        isTrackingInProgressRef.current = false;
                    },
                    onSuccess: () => {
                        // Only update timestamp on success to ensure we only send once per 24 hours
                        const utcDate = dayjs.utc().format('YYYY-MM-DD');
                        localStorage.setItem('analytics_app_tracker_timestamp', utcDate);

                        logFn.debug(logMsg[LogCategory.ANALYTICS].appTracked, {
                            category: LogCategory.ANALYTICS,
                            meta: { properties },
                        });
                    },
                });
            }
        };

        // Check immediately on mount
        if (!hasRunOnMountRef.current) {
            hasRunOnMountRef.current = true;
            checkAndTrack();
        }

        const interval = setInterval(checkAndTrack, 1000 * 60 * 60);

        return () => clearInterval(interval);
    }, [trackAppMutation]);
};

const appTrackerMutation = mutationOptions({
    mutationFn: (properties: AppTrackerProperties) => {
        try {
            window.umami?.track((props) => ({
                ...props,
                data: properties,
                name: 'app',
            }));
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    },
    mutationKey: ['analytics', 'settings-tracker'],
    onSuccess: () => {},
    retry: false,
    throwOnError: false,
});
