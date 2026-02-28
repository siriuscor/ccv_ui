# Manmori 漫画下载器

一款基于 Electron + Puppeteer 的漫画下载工具，支持从多个漫画网站搜索、下载漫画章节，并打包为 CBZ/EPUB/ZIP 格式。

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blue)
![Electron](https://img.shields.io/badge/Elector-31.x-brightgreen)

## 功能特性

- 🔍 **多站点搜索** - 支持从多个漫画网站搜索漫画
- 📥 **批量下载** - 支持选择多个章节批量下载
- 📦 **多格式输出** - 支持 CBZ、EPUB、ZIP 三种格式
- ⏸️ **任务管理** - 支持暂停、恢复、删除下载任务
- 🔄 **断点续传** - 自动检测已下载章节，避免重复下载
- 🛡️ **广告拦截** - 内置广告拦截功能
- 🎮 **复古UI** - 采用 NES 风格界面

## 支持的漫画网站

| 网站 | 说明 |
|------|------|
| manhuagui | 漫画柜 (需翻墙) |
| mangabz | 漫画包子 |
| yymanhua | YY漫画 |
| mangacopy | 漫画拷贝 |
| dm5 | 漫画DB |
| 1kkk | 来看 |

## 环境要求

- Node.js 18+
- Chrome/Chromium (用于 Puppeteer)
- macOS / Windows

## 安装

```bash
# 安装依赖
npm install

# 开发模式运行
npm start
```

## 打包

```bash
# macOS
npm run package

# Windows
npm run pack-win
```

## 使用方法

1. 启动应用后，在设置中配置下载保存路径和输出格式
2. 选择漫画网站，输入关键词搜索
3. 在搜索结果中点击漫画查看详情
4. 选择要下载的章节（支持 Shift 多选）
5. 点击确认开始下载

## 项目结构

```
comtaku/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本 (IPC)
├── src/
│   ├── mantaku.js       # 核心下载逻辑
│   ├── task.js          # 任务队列管理
│   ├── utils.js         # 工具函数
│   ├── sites/           # 网站解析器
│   │   ├── common.js    # 公共接口
│   │   ├── manhuagui.js
│   │   ├── mangabz.js
│   │   └── ...
│   └── bin/             # 工具二进制
│       ├── dwebp_osx
│       ├── dwebp_linux
│       └── dwebp_win.exe
├── public/
│   └── index.html       # 前端界面
└── package.json
```

## 技术栈

- **Electron** - 桌面应用框架
- **Puppeteer** - 无头浏览器
- **Preact** - 前端 UI 框架
- **JSZip** - ZIP/CBZ 打包
- **@lesjoursfr/html-to-epub** - EPUB 生成

## 快捷键

- `Ctrl + D` - 切换调试模式

## License

ISC
