import type { FileItem, FolderItem, ApiResponse } from '../types';

/**
 * 验证文件项
 */
export function validateFileItem(item: any): item is FileItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.url === 'string' &&
    typeof item.folder_path === 'string' &&
    typeof item.obj_token === 'string' &&
    typeof item.obj_type === 'string' &&
    typeof item.type === 'string' &&
    typeof item.name === 'string' &&
    item.url.length > 0 &&
    item.obj_token.length > 0 &&
    item.name.length > 0
  );
}

/**
 * 验证文件夹项
 */
export function validateFolderItem(item: any): item is FolderItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.path === 'string' &&
    typeof item.token === 'string' &&
    item.path.length > 0 &&
    item.token.length > 0
  );
}

/**
 * 验证 API 响应
 */
export function validateApiResponse<T>(
  response: any,
  dataValidator?: (data: any) => data is T
): response is ApiResponse<T> {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if (typeof response.code !== 'number' || typeof response.msg !== 'string') {
    return false;
  }

  if (dataValidator && response.data !== undefined && !dataValidator(response.data)) {
    return false;
  }

  return true;
}

/**
 * 验证文件列表
 */
export function validateFileList(list: any): list is FileItem[] {
  return Array.isArray(list) && list.every(validateFileItem);
}

/**
 * 验证文件夹列表
 */
export function validateFolderList(list: any): list is FolderItem[] {
  return Array.isArray(list) && list.every(validateFolderItem);
}

/**
 * 验证文件类型
 */
export function isValidFileType(objType: string): boolean {
  return ['doc', 'sheet', 'bitable'].includes(objType);
}

/**
 * 验证文件扩展名
 */
export function getFileExtension(objType: string): string {
  switch (objType) {
    case 'sheet':
    case 'bitable':
      return 'xlsx';
    case 'doc':
    default:
      return 'docx';
  }
}

/**
 * 验证 URL 格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理和验证文件名
 */
export function sanitizeFileName(fileName: string): string {
  // 移除或替换不安全的字符
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 255); // 限制文件名长度
}