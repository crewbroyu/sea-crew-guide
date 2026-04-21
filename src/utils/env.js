// src/utils/env.js

/**
 * 环境变量管理工具
 * 统一管理和获取环境变量，提供类型安全的访问方式
 */

// 应用配置
export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || '海乘指南',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0'
};

// API配置
export const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.seacrew-guide.com',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000
};

// 其他环境配置
export const envConfig = {
  // 判断当前环境
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',
  
  // 构建信息
  mode: import.meta.env.MODE,
  base: import.meta.env.BASE_URL
};

/**
 * 获取环境变量
 * @param {string} key - 环境变量键名
 * @param {any} defaultValue - 默认值
 * @returns {any} 环境变量值或默认值
 */
export const getEnv = (key, defaultValue = null) => {
  return import.meta.env[key] || defaultValue;
};

export default {
  app: appConfig,
  api: apiConfig,
  env: envConfig,
  get: getEnv
};