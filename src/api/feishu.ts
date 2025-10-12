/**
 * 飞书 API 调用模块
 * 统一管理所有与飞书服务器的交互
 */

import type { ExportTaskParams, ApiResponse } from '~types';
import { logger } from '~utils/logger';
import { safeFetch, safeJsonParse } from '~utils/errorHandler';
import { CONFIG } from '~utils/config';
import { sleep, getCookies } from '~utils/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * 获取我的空间文件夹列表
 */
export async function fetchFolders(): Promise<any> {
    await sleep(500);
    const url = `${window.location.origin}/space/api/explorer/v3/my_space/folder/?asc=1&rank=5&length=50`;
    return await getJson(url);
}

/**
 * 获取共享空间文件夹列表
 */
export async function fetchShareFolders(): Promise<any> {
    await sleep(500);
    const url = `${window.location.origin}/space/api/explorer/v2/share/folder/list/?asc=0&rank=3&hidden=0&length=50`;
    return await getJson(url);
}

/**
 * 获取指定文件夹的子项列表
 */
export async function fetchChildrenList(token: string): Promise<any> {
    await sleep(500);
    const url = `${window.location.origin}/space/api/explorer/v3/children/list/?asc=1&rank=5&token=${token}`;
    return await getJson(url);
}

/**
 * 获取我的空间文件列表
 */
export async function fetchMySpaceFileList(): Promise<any> {
    await sleep(500);
    const url = `${window.location.origin}/space/api/explorer/v3/my_space/obj/`;
    return await getJson(url);
}

/**
 * 创建导出任务
 */
export async function createExportTask(data: ExportTaskParams, url: string, type: string): Promise<any> {
    try {
        await sleep(CONFIG.api.delay);
        const requestId = 'vq4ZjJifJq49-' + uuidv4().replace(/-/g, '');
        const csrfToken = await getCookies('_csrf_token');
        
        logger.debug('Creating export task', { 
            token: data.token, 
            type: data.type, 
            file_extension: data.file_extension,
            csrfToken: csrfToken ? 'present' : 'missing'
        });
        
        const apiUrl = `${window.location.origin}/space/api/export/create/?synced_block_host_token=${data.token}&synced_block_host_type=${type}`;
        
        const response = await safeFetch(apiUrl, {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "no-cache",
                "content-type": "application/json",
                "context": `request_id=${requestId};os=mac;app_version=2.0.0.4393;os_version=10.15.7;platform=web`,
                "doc-biz": "Lark",
                "doc-os": "mac",
                "doc-platform": "web",
                "f-version": "docs-9-28-1759072328633",
                "origin": window.location.origin,
                "pragma": "no-cache",
                "priority": "u=1, i",
                "referer": url,
                "request-id": requestId,
                "rpc-persist-lane-c-lark-uid": "0",
                "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"macOS"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
                "x-csrftoken": csrfToken,
                "x-lgw-app-id": "1161",
                "x-lgw-os-type": "3",
                "x-lgw-terminal-type": "2",
                "x-request-id": requestId,
                "x-tt-logid": `02176018710592100000000000000000000ffffc287f50a75e2e8`,
                "x-tt-trace-id": requestId
            },
            "referrer": url,
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": JSON.stringify(data),
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        }, `createExportTask: ${data.token}`);
        
        if (!response) {
            logger.error('Failed to create export task', { token: data.token });
            return null;
        }
        
        const json = await safeJsonParse(response, `createExportTask: ${data.token}`);
        
        if (json && json.code === 0) {
            logger.info('Export task created successfully', { 
                token: data.token, 
                ticket: json.data?.ticket 
            });
            return json.data;
        } else {
            logger.error('Export task creation failed', { 
                token: data.token, 
                error: json 
            });
            return null;
        }
    } catch (error) {
        logger.error('Exception in createExportTask', { 
            token: data.token, 
            error 
        });
        return null;
    }
}

/**
 * 等待导出结果
 */
export async function waitForExportResult(ticket: string, token: string, obj_type: string, type: string): Promise<any> {
    for (let i = 0; i < CONFIG.api.retryCount; i++) {
        await sleep(2000);
        const result = await fetchExportResult(ticket, token, obj_type, type);
        if (result) return result;
    }
    return null;
}

/**
 * 获取导出结果
 */
export async function fetchExportResult(ticket: string, token: string, obj_type: string, type: string): Promise<any> {
    const url = `${window.location.origin}/space/api/export/result/?ticket=${ticket}&token=${token}&obj_type=${obj_type}&type=${type}`;
    const json = await getJson(url);
    return json.code === 0 ? json.data : null;
}

/**
 * 下载文件
 */
export async function download(file_token: string, token: string, type: string): Promise<Response | null> {
    const url = `${window.location.origin}/space/api/export/download/?file_token=${file_token}&token=${token}&type=${type}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            return response;
        }
        logger.error('Download failed with status', { status: response.status, statusText: response.statusText });
        return null;
    } catch (error) {
        logger.error('Download failed', { file_token, error });
        return null;
    }
}

/**
 * 通用 JSON 请求函数
 */
async function getJson(url: string): Promise<any> {
    try {
        const response = await safeFetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        }, `getJson: ${url}`);
        
        if (!response) {
            logger.error('Failed to fetch JSON', { url });
            return null;
        }
        
        return await safeJsonParse(response, `getJson: ${url}`);
    } catch (error) {
        logger.error('Exception in getJson', { url, error });
        return null;
    }
}