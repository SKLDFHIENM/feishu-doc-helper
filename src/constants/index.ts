// API 相关常量
export const API_ENDPOINTS = {
  FEISHU_DOMAIN: 'https://*.feishu.cn',
  LARKSUITE_DOMAIN: 'https://*.larksuite.com',
} as const;

// 存储键名常量
export const STORAGE_KEYS = {
  FEISHU_FILE_LIST: 'feishuFileList',
  ROAM_EXCLUDE_FOLDER: 'roamExcludeFolder',
  FEISHU_FOLDER_LIST: 'feishuFolderList',
  EXPORT_PROGRESS: 'exportProgress',
} as const;

// 页面匹配规则
export const PAGE_MATCHES = {
  FEISHU_ALL: ['https://*.feishu.cn/*'] as string[],
  FEISHU_DRIVE: ['https://*.feishu.cn/drive/*'] as string[],
};

// 导出相关常量
export const EXPORT_CONFIG = {
  MAX_CONCURRENCY: 3,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 30000,
} as const;

// 社交媒体链接
export const SOCIAL_LINKS = {
  GITHUB_ISSUES: 'https://github.com/sancijun/feishu-doc-helper/issues',
  BILIBILI: 'https://space.bilibili.com/518029478',
  DOUYIN: 'https://www.douyin.com/user/MS4wLjABAAAA5O4Hg8U4Sm6C4_9_c-5w5w',
  WECHAT_MP: 'https://mp.weixin.qq.com/s/xyz',
} as const;

// 图片资源链接
export const IMAGE_URLS = {
  BILIBILI_QR: 'https://img2023.cnblogs.com/blog/2740513/202305/2740513-20230530083651756-1915761883.jpg',
  TIKTOK_QR: 'https://img2023.cnblogs.com/blog/2740513/202305/2740513-20230529203236662-1716684994.jpg',
  WECHAT_GZH_QR: 'https://img2023.cnblogs.com/blog/2740513/202305/2740513-20230529203219168-2117666216.jpg',
  WECHAT_QR: 'https://img2023.cnblogs.com/blog/2740513/202305/2740513-20230529203303815-1142190090.jpg',
} as const;

// 文件类型常量
export const FILE_TYPES = {
  DOCX: 'docx',
  PDF: 'pdf',
  MARKDOWN: 'markdown',
} as const;

// 日志级别
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;