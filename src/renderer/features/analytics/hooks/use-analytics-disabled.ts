export const isAnalyticsDisabled = () => {
    return localStorage.getItem('umami.disabled') === '1' || process.env.NODE_ENV === 'development';
};
