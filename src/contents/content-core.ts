
import type { PlasmoCSConfig } from 'plasmo';
import type { FileItem, FolderItem } from '~types';
import { logger } from '~utils/logger';
import { CONFIG } from '~utils/config';
import { sleep, getLocalStorageData, copy } from '~utils/common';
import { 
    fetchFolders, 
    fetchShareFolders, 
    fetchChildrenList, 
    fetchMySpaceFileList,
    createExportTask,
    waitForExportResult,
    download
} from '~api/feishu';
import { PAGE_MATCHES, STORAGE_KEYS } from '~constants';

export const config: PlasmoCSConfig = {
    matches: ["https://*.feishu.cn/drive/*"],
    all_frames: true
};

// 初始化消息监听
function initMessageListener() {
    console.log('initMessageListener');
    // 监听 service worker 消息
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.alert) {
            console.error(msg.alert);
            sendResponse({ succ: 1 });
        } else if (msg.content) {
            copy(msg.content);
        }
    });
}

async function loadAllFileList() {
    logger.info('Starting to load file list');
    const currentTime = Date.now();
    const lastLoadTime = await getLocalStorageData('lastLoadTime') || 0;
    const lastHostName = await getLocalStorageData('lastHostName') || '';
    
    logger.debug('Load file list check', { 
        currentTime, 
        lastLoadTime, 
        lastHostName, 
        currentHost: window.location.hostname 
    });
    
    if (currentTime - lastLoadTime < CONFIG.cache.ttl && lastHostName === window.location.hostname) {
        logger.info('Using cached file list');
        return;
    }

    try {
        const fileList: any[] = [];
        const folderList: any[] = [];

        const mySpaceFolder = await fetchFolders();
        const shareSpaceFolder = await fetchShareFolders();
        
        if (!mySpaceFolder || !shareSpaceFolder) {
            logger.error('Failed to fetch folder data');
            return;
        }
        
        const allFolder = new Set([...mySpaceFolder.node_list, ...shareSpaceFolder.node_list]);
        logger.debug('Loaded folders', { 
            mySpaceCount: mySpaceFolder.node_list.length, 
            shareSpaceCount: shareSpaceFolder.node_list.length, 
            totalCount: allFolder.size 
        });
        
        for (const token of allFolder) {
            const folder = mySpaceFolder.entities.nodes[token] || shareSpaceFolder.entities.nodes[token];
            folderList.push({ path: folder.name, token: folder.token });
            await getFileList(token, folder.name, fileList, folderList);
        }
        await getFileList('', '我的空间', fileList, folderList);
        folderList.push({ path: '我的空间', token: '' });
        
        logger.info('File list loaded successfully', { 
            fileCount: fileList.length, 
            folderCount: folderList.length 
        });

        // 保存到本地存储
        await Promise.all([
            chrome.storage.local.set({ [STORAGE_KEYS.FEISHU_FILE_LIST]: fileList }),
            chrome.storage.local.set({ 'feishuFolderList': folderList }),
            chrome.storage.local.set({ 'lastLoadTime': currentTime }),
            chrome.storage.local.set({ 'lastHostName': window.location.hostname })
        ]);
        
    } catch (error) {
        logger.error('Failed to load file list', { error });
    }
}

async function getFileList(token: string, folder_path: string, fileList: any[], folderList: any[]) {
    const ret = token ? await fetchChildrenList(token) : await fetchMySpaceFileList();

    for (const nodeId of ret.data.node_list) {
        const node = ret.data.entities.nodes[nodeId];
        if (node.token != token && node.type == 0) {
            await getFileList(node.token, `${folder_path}/${node.name}`, fileList, folderList);
            let path = `${folder_path}/${node.name}`;
            folderList.push({ path: path, token: node.token });
        } else if (node.token != token && node.type != 0) {
            let url_parts = node.url.split('/');
            let type = url_parts[url_parts.length - 2]
            if (type == 'base') {
                node.obj_type = 'bitable'
            } else if (type == 'sheets') {
                node.obj_type = 'sheet'
            } else {
                node.obj_type = type
            }
            node.folder_path = folder_path;
            fileList.push(node);
        }
    }
}

// 导出核心函数
export { 
    loadAllFileList, 
    createExportTask, 
    waitForExportResult, 
    download 
};