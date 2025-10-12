import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Popover, Cascader } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBilibili, faTiktok, faWeixin } from '@fortawesome/free-brands-svg-icons';
import { cascaderData } from '~utils/common';
import type { FolderItem, CascaderOption } from '~types';
import { STORAGE_KEYS, SOCIAL_LINKS, IMAGE_URLS } from '~constants';

const { Paragraph } = Typography;

const AboutPageContent = () => {
  const AboutPageContent = {
    bilibili: <img src={IMAGE_URLS.BILIBILI_QR} alt="视频B站首发" style={{ width: '150px', height: '150px' }} />,
    tiktok: <img src={IMAGE_URLS.TIKTOK_QR} alt="抖音" style={{ width: '150px', height: '150px' }} />,
    gzh: <img src={IMAGE_URLS.WECHAT_GZH_QR} alt="公众号" style={{ width: '150px', height: '150px' }} />,
    wechat: <img src={IMAGE_URLS.WECHAT_QR} alt="微信号" style={{ width: '150px', height: '150px' }} />,
  };

  const openLink = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="飞书文档助手" style={{ marginBottom: '20px' }}>
        <Paragraph>
          飞书文档助手是一款浏览器插件，旨在增强飞书云文档的使用体验。
        </Paragraph>
        <Paragraph>
          <strong>主要功能：</strong>
        </Paragraph>
        <ul>
          <li>批量导出文档：支持选择文件夹批量导出文档为 docx、xlsx 等格式</li>
          <li>文档漫游：随机跳转到文档库中的任意文档，帮助发现被遗忘的内容</li>
        </ul>
      </Card>

      <Card title="使用说明" style={{ marginBottom: '20px' }}>
        <Paragraph>
          1. 在飞书云空间页面，插件会自动加载您的文档列表
        </Paragraph>
        <Paragraph>
          2. 使用"批量导出"功能选择要导出的文件夹
        </Paragraph>
        <Paragraph>
          3. 使用"文档漫游"功能随机浏览文档
        </Paragraph>
        <Paragraph>
          4. 在设置页面可以配置漫游时要排除的文件夹
        </Paragraph>
      </Card>

      <Card title="功能建议 & 缺陷反馈" style={{ marginBottom: '20px' }}>
        <Button type="link" onClick={() => openLink(SOCIAL_LINKS.GITHUB_ISSUES)}>
          GitHub Issues
        </Button>
      </Card>

      <Card title="关于作者">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Popover content="微信：sancijun" title="微信">
            <FontAwesomeIcon icon={faWeixin} size="2x" style={{ color: '#07C160', cursor: 'pointer' }} />
          </Popover>
          <FontAwesomeIcon 
            icon={faBilibili} 
            size="2x" 
            style={{ color: '#FB7299', cursor: 'pointer' }} 
            onClick={() => openLink(SOCIAL_LINKS.BILIBILI)}
          />
          <FontAwesomeIcon 
            icon={faTiktok} 
            size="2x" 
            style={{ color: '#000000', cursor: 'pointer' }} 
            onClick={() => openLink(SOCIAL_LINKS.DOUYIN)}
          />
          <Button type="link" onClick={() => openLink(SOCIAL_LINKS.WECHAT_MP)}>
            公众号：三此君
          </Button>
        </div>
      </Card>
    </div>
  );
}


function SettingsPageContent() {
  const [cascaderOptions, setCascaderOptions] = useState<CascaderOption[]>([]);
  const [selectedValue, setSelectedValue] = useState<string[][]>([]);

  useEffect(() => {
    chrome.storage.local.get(
      [STORAGE_KEYS.FEISHU_FOLDER_LIST, STORAGE_KEYS.ROAM_EXCLUDE_FOLDER],
      (result) => {
        const { [STORAGE_KEYS.FEISHU_FOLDER_LIST]: feishuFolderList, [STORAGE_KEYS.ROAM_EXCLUDE_FOLDER]: roamExcludeFolder } = result;
        if (feishuFolderList) {
          setCascaderOptions(cascaderData(feishuFolderList))
        }
        setSelectedValue(roamExcludeFolder || [])
      }
    );
  }, []);

  const handleCascaderChange = (value: any) => {
    setSelectedValue(value);
    chrome.storage.local.set({ [STORAGE_KEYS.ROAM_EXCLUDE_FOLDER]: value });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="文档漫游设置">
        <div style={{ marginBottom: '15px' }}>
          <strong>排除目录：</strong>
        </div>
        <Cascader
          options={cascaderOptions}
          onChange={handleCascaderChange}
          value={selectedValue}
          multiple
          placeholder="选择要排除的目录"
          style={{ width: '100%' }}
          showSearch
        />
        <div style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>
          选择的目录将不会在文档漫游中出现
        </div>
      </Card>
    </div>
  );
}

const tabList = [
  {
    key: 'tab1',
    tab: '关于',
  },
  {
    key: 'tab2',
    tab: '设置',
  },
];

const contentList: Record<string, React.ReactNode> = {
  tab1: <AboutPageContent />,
  tab2: <SettingsPageContent />,
};

const PopupPage: React.FC = () => {
  const [activeTabKey, setActiveTabKey] = useState<string>('tab1');

  const onTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  return (
    <div style={{ width: '400px', height: '500px' }}>
      <Card
        style={{ width: '100%', height: '100%' }}
        tabList={tabList}
        activeTabKey={activeTabKey}
        onTabChange={onTabChange}
        tabProps={{
          size: 'middle',
        }}
      >
        {contentList[activeTabKey]}
      </Card>
    </div>
  );
};

export default PopupPage;
