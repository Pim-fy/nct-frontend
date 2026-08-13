import { useContext } from 'react';
import { ConfigContext, defaultConfig } from './configContextValue';

// 담당자 7: 레거시 ConfigProvider 소비 경로를 Fast Refresh 경계 밖으로 분리합니다.
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    return {
      config: defaultConfig,
      getConfig: (key, fallback = null) => defaultConfig[key] ?? fallback,
      setConfigValue: () => {},
      mergeConfig: () => {},
    };
  }
  return context;
};
