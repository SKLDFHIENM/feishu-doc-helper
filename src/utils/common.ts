/**
 * 通用工具函数模块
 * 包含项目中常用的工具函数
 */

import { logger } from './logger';
import type { FolderItem, CascaderOption } from '../types';

/**
 * 延迟执行函数
 * @param ms 延迟毫秒数
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 模拟点击元素
 * @param element 要点击的元素
 * @param init 额外的事件初始化参数
 */
export function simulateClick(element: HTMLElement, init = {}): void {
    const clientRect = element.getBoundingClientRect();
    const clientX = clientRect.left;
    const clientY = clientRect.top;
    const position = { clientX: clientX, clientY: clientY };
    Object.assign(init, position);
    let mouseEvent = new MouseEvent("click", init);
    element.dispatchEvent(mouseEvent);
}

/**
 * 从本地存储获取数据
 * @param key 存储键名
 */
export async function getLocalStorageData(key: string): Promise<any> {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key]);
        });
    });
}

/**
 * 获取当前时间戳字符串
 * @returns 格式化的时间戳字符串 (YYYYMMDDHHMMSSMMM)
 */
export function getCurrentTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}

/**
 * 获取指定名称的 Cookie 值
 * @param fieldName Cookie 字段名
 */
export async function getCookies(fieldName: string): Promise<string | null> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
            type: 'getCookies', 
            fieldName: fieldName, 
            url: window.location.href 
        }, (response) => {
            resolve(response?.fieldValue || null);
        });
    });
}

/**
 * 复制文本到剪贴板
 * @param targetText 要复制的文本
 */
export async function copy(targetText: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(targetText);
        logger.debug('Text copied to clipboard', { length: targetText.length });
    } catch (err) {
        logger.error('Failed to copy text to clipboard', { error: err });
        throw err;
    }
}

/**
 * 将文件夹列表转换为级联选择器数据结构
 * @param data 文件夹列表
 */
export function cascaderData(data: FolderItem[]): CascaderOption[] {
    const options: CascaderOption[] = [];
    options.push({ label: '全部导出', value: '全部导出' });
    
    data.forEach((item) => {
        const pathSegments = item.path.split('/');
        let currentOptions = options;

        pathSegments.forEach((segment, index) => {
            const existingOption = currentOptions.find((option) => option.label === segment);

            if (!existingOption) {
                const newOption: CascaderOption = { 
                    label: segment, 
                    value: index === pathSegments.length - 1 ? item.path : '', 
                    children: [] 
                };
                currentOptions.push(newOption);
                currentOptions = newOption.children!;
            } else {
                currentOptions = existingOption.children!;
            }
        });
    });
    
    logger.debug('Cascader data generated', { optionsCount: options.length });
    return options;
}