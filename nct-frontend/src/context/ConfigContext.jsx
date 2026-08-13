// src/context/ConfigContext.jsx
import { useState } from 'react';
import { ConfigContext, defaultConfig } from './configContextValue';

export const ConfigProvider = ({ children, initialConfig = {} }) => {
  const [config, setConfig] = useState({ ...defaultConfig, ...initialConfig });

  const getConfig = (key, fallback = null) => config[key] ?? fallback;

  const setConfigValue = (key, value) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  const mergeConfig = (updates) =>
    setConfig(prev => ({ ...prev, ...updates }));

  return (
    <ConfigContext.Provider value={{ config, getConfig, setConfigValue, mergeConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};
