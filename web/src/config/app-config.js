export const appConfig = Object.freeze({
  version: import.meta.env.VITE_APP_VERSION || '2.1.0',
  releaseName: import.meta.env.VITE_APP_RELEASE_NAME || 'V2.1 协作效率版',
  repositoryUrl: import.meta.env.VITE_REPOSITORY_URL || 'https://github.com/YEXIAONAN/NextLaunchHub',
  authorUrl: import.meta.env.VITE_AUTHOR_URL || 'https://github.com/YEXIAONAN'
});
