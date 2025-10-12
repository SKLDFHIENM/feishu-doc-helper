import React, { useEffect, useState } from 'react';
import { Button, Tooltip, Modal, Cascader, notification } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareFromSquare } from '@fortawesome/free-regular-svg-icons';
import type { PlasmoCSConfig } from 'plasmo';
import { loadAllFileList } from './content-core';
import { cascaderData, getCurrentTimestamp, getLocalStorageData, sleep } from '~utils/common';
import { createExportTask, download, waitForExportResult } from '~api/feishu';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import type { FileItem, FolderItem, CascaderOption, ExportProgress } from '~types';
import { logger } from '~utils/logger';
import { ConcurrencyController } from '~utils/errorHandler';
import { CONFIG } from '~utils/config';

import './content-menu.css';

import { PAGE_MATCHES, STORAGE_KEYS } from '~constants';

export const config: PlasmoCSConfig = {
    matches: ["https://*.feishu.cn/*"],
    all_frames: true
};

export const getRootContainer = async () => {
    let referenceElement;
    for (let retryCount = 0; retryCount < 50 && !referenceElement; retryCount++) {
        await sleep(500)
        referenceElement = document.querySelector('.new-notice-wrapper') || document.querySelector('.suite-notice-center');
        console.log('root', referenceElement);
    }
    const menuContainer = document.createElement('div');
    referenceElement.insertAdjacentElement('beforebegin', menuContainer);
    return menuContainer;
};

const Export: React.FC = () => {
    const [api, contextHolder] = notification.useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cascaderOptions, setCascaderOptions] = useState<CascaderOption[]>([]);
    const [selectedValue, setSelectedValue] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadAllFileList();
    }, []);

    async function exportSingleFile(file: FileItem, zip: JSZip, progress: ExportProgress): Promise<boolean> {
        try {
            logger.debug('Starting export for file', { fileName: file.name, objToken: file.obj_token });
            
            await sleep(CONFIG.api.delay);
            const file_extension = file.obj_type === 'sheet' || file.obj_type === 'bitable' ? 'xlsx' : 'docx';
            
            const resp = await createExportTask({
                "token": file.obj_token,
                "type": file.obj_type,
                "file_extension": file_extension,
                "event_source": 1,
                "need_comment": false
            }, file.url, file.type);

            const ticket = resp?.data?.ticket;
            if (!ticket) {
                logger.error('Failed to create export task for file', { fileName: file.name });
                return false;
            }

            const file_token = await waitForExportResult(ticket, file.obj_token, file.obj_type, file.type);
            if (!file_token) {
                logger.error('Failed to get export result for file', { fileName: file.name });
                return false;
            }

            const fileBlob = await download(file_token, file.obj_token, file.type);
            if (!fileBlob) {
                logger.error('Failed to download file', { fileName: file.name });
                return false;
            }

            // 将 Response 转换为 Blob
            const blob = await fileBlob.blob();

            // 创建文件夹结构
            let folderPath = '';
            for (const part of file.folder_path.split("/")) {
                if (part) {
                    folderPath += part + '/';
                    if (!zip.folder(folderPath.slice(0, -1))) {
                        zip.folder(folderPath.slice(0, -1));
                    }
                }
            }

            // 添加文件到 ZIP
            const fileName = `${file.name}.${file_extension}`;
            const filePath = folderPath ? `${folderPath}${fileName}` : fileName;
            zip.file(filePath, blob);

            logger.debug('File exported successfully', { fileName: file.name });
            return true;
        } catch (error) {
            logger.error('Error exporting file', { fileName: file.name, error });
            return false;
        }
    }

    async function onExportDocs(folderList: string[]) {
        if (isExporting) {
            logger.warn('Export already in progress');
            return;
        }

        setIsExporting(true);
        
        try {
            const zip = new JSZip();
            const fileList = await getLocalStorageData(STORAGE_KEYS.FEISHU_FILE_LIST) as FileItem[];
            const exportList = folderList.includes('全部导出') 
                ? fileList 
                : fileList.filter((file: FileItem) => 
                    folderList.some((folder: string) => file.folder_path.includes(folder))
                );
            
            logger.info('Starting batch export', { totalFiles: exportList.length });

            const concurrencyController = new ConcurrencyController(CONFIG.export.concurrency);
            const progress: ExportProgress = {
                total: exportList.length,
                current: 0,
                currentFile: '',
                status: 'processing'
            };

            let successCount = 0;
            let failedCount = 0;

            const exportPromises = exportList.map((file, index) => 
                concurrencyController.execute(async () => {
                    progress.currentFile = file.name;
                    progress.current = index + 1;
                    
                    const curProgress = `${progress.current}/${progress.total}`;
                    api['info']({
                        key: 'export progress notification',
                        message: '文档批量导出',
                        description: (
                            <span>
                                文档导出中，导出速度取决于导出文档数量，当前进度 <span style={{ color: 'blue' }}>{curProgress}</span>， 导出完成前请勿关闭或刷新本页面。
                            </span>
                        ),
                        duration: null,
                    });

                    const success = await exportSingleFile(file, zip, progress);
                    if (success) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                    
                    return success;
                })
            );

            await Promise.all(exportPromises);

            // 生成并下载 ZIP 文件
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const timestamp = getCurrentTimestamp();
            saveAs(zipBlob, `飞书文档导出_${timestamp}.zip`);

            const message = failedCount > 0 
                ? `导出完成，成功 ${successCount} 个，失败 ${failedCount} 个文档。`
                : `导出完成，共导出 ${successCount} 个文档。`;

            api[failedCount > 0 ? 'warning' : 'success']({
                key: 'export progress notification',
                message: '文档批量导出',
                description: message,
                duration: 5,
            });

            logger.info('Batch export completed', { 
                total: exportList.length, 
                success: successCount, 
                failed: failedCount 
            });

        } catch (error) {
            logger.error('Batch export failed', { error });
            api['error']({
                key: 'export progress notification',
                message: '文档批量导出',
                description: '导出过程中发生错误，请重试。',
                duration: 5,
            });
        } finally {
            setIsExporting(false);
        }
    }

    const showModal = async () => {
        const feishuFolderList = await getLocalStorageData('feishuFolderList') as FolderItem[];
        if (!feishuFolderList || feishuFolderList.length === 0) {
            api['warning']({
                message: '文档列表为空',
                description: '请先在飞书云空间页面加载文档列表。',
                duration: 3,
            });
            return;
        }
        setCascaderOptions(cascaderData(feishuFolderList));
        setIsModalOpen(true);
    };

    const handleOk = () => {
        if (selectedValue.length === 0) {
            api['warning']({
                message: '请选择要导出的文件夹',
                description: '至少选择一个文件夹进行导出。',
                duration: 3,
            });
            return;
        }
        
        if (isExporting) {
            api['warning']({
                message: '导出正在进行中',
                description: '请等待当前导出任务完成。',
                duration: 3,
            });
            return;
        }
        
        setIsModalOpen(false);
        onExportDocs(selectedValue);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleCascaderChange = (value: any) => {
        setSelectedValue(value);
    };

    return (
        <>
            {contextHolder}
            <Tooltip placement="bottom" title='批量导出'>
                <Button 
                    type="text" 
                    onClick={showModal} 
                    icon={<FontAwesomeIcon icon={faShareFromSquare} />} 
                    style={{ marginLeft: '10px' }}
                    loading={isExporting}
                    disabled={isExporting}
                />
            </Tooltip>
            <Modal title="选择要导出的文件夹" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <Cascader
                    options={cascaderOptions}
                    onChange={handleCascaderChange}
                    value={selectedValue}
                    multiple
                    placeholder="选择要导出的文件夹"
                    style={{ width: '100%' }}
                    showSearch
                />
            </Modal>
        </>
    )
}

export default Export;
