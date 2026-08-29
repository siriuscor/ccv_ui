# Manmori 漫画下载器

Manmori 是一款基于 Electron、Puppeteer 和 React 的桌面漫画下载与阅读工具。它可以从多个漫画站点搜索作品、批量下载章节，将内容打包为 CBZ、EPUB 或 ZIP，并直接在应用内阅读已下载内容。

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blue)
![Electron](https://img.shields.io/badge/Electron-31.x-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.2-orange)

## 功能

- **多站点搜索**：检测站点连接状态，并优先显示响应较快的站点。
- **批量章节下载**：支持单选、全选、反选，以及按住 `Shift` 点击进行连续区间选择。
- **下载任务管理**：显示任务进度和状态，支持暂停、继续、移除与清空任务。
- **重复任务过滤**：跳过已经加入下载队列的章节，并提示重复章节。
- **多格式输出**：支持 CBZ、EPUB 和 ZIP。
- **已下载内容管理**：按漫画查看本地章节，并可返回源站继续下载。
- **内置漫画阅读器**：支持点击、滑动、方向键翻页、缩略图选页、进度条和全屏阅读。
- **章节连续阅读**：本话结束后可继续下一话，控制栏可直接切换上一话或下一话。
- **阅读进度恢复**：自动记录最后阅读的章节与页码，在“已下载”页面可一键继续阅读。
- **广告拦截**：抓取页面时使用内置 EasyList 规则减少广告请求。

## 支持的站点

| ID | 网站 |
| --- | --- |
| `manhuagui` | 漫画柜 |
| `mangabz` | Mangabz |
| `yymanhua` | YY漫画 |
| `mangacopy` | 拷贝漫画 |
| `dm5` | dm5漫画人 |
| `1kkk` | 1kkk漫画 |

站点页面结构、访问限制或网络环境变化都可能影响搜索和下载结果。

## 环境要求

- Node.js 18 或更高版本
- npm
- macOS 或 Windows

## 安装与运行

项目根目录和 React 前端分别维护依赖，首次运行需要安装两次：

```bash
# Electron 主程序依赖
npm install

# React 前端依赖
npm --prefix public/comicui install

# 构建前端并启动 Electron
npm start
```

应用启动后，在设置中选择下载目录和打包格式。

## 使用流程

1. 选择可用站点并搜索漫画。
2. 打开漫画详情，选择需要下载的章节。
3. 使用普通点击选择单章；按住 `Shift` 点击可选中两个章节之间的全部章节，也可以使用“全选”或“反选”。
4. 开始下载，并在“任务”中查看进度或暂停、继续任务。
5. 下载完成后，在“已下载”中打开漫画和章节。
6. 阅读器会自动保存阅读位置；下次可通过“已下载”顶部的“继续阅读”入口恢复。

## 阅读器操作

| 操作 | 功能 |
| --- | --- |
| 点击画面左右区域 | 根据阅读方向翻页 |
| `←` / `→` / `↑` / `↓` | 翻页 |
| 滑动 | 翻页 |
| `Space` / `Enter` | 显示或隐藏控制栏 |
| `Esc` | 退出全屏、关闭面板或返回漫画章节列表 |
| 控制栏“上一话”/“下一话” | 切换相邻的已下载章节 |

在本话最后一页再次向后翻页时，阅读器会显示“继续看 XX话”的提示；若没有更多已下载章节，则显示相应说明。

## 开发与检查

```bash
# 构建 React 前端
npm run build-web

# 前端代码检查
npm --prefix public/comicui run lint

# 前端测试
npm --prefix public/comicui test
```

## 打包

```bash
# macOS Apple Silicon（electron-packager）
npm run package

# macOS 安装包（electron-builder）
npm run dist-mac

# Windows x64 目录包
npm run pack-win

# Windows x64 安装包与便携版
npm run dist-win
```

构建配置会把 Electron 主进程、预加载脚本、下载逻辑、站点解析器以及 `public/comicui/dist` 前端产物一起打包。

## 项目结构

```text
ccv_ui/
├── main.js                         # Electron 主进程、窗口与 IPC
├── preload.js                      # 安全暴露给前端的桌面 API
├── src/
│   ├── mantaku.js                  # 站点加载、搜索与章节抓取
│   ├── task.js                     # 下载任务队列
│   ├── config.js                   # 应用配置
│   ├── librarian.js                # 漫画信息持久化
│   └── sites/                      # 各漫画站点解析器
├── public/
│   ├── splash.html                 # 启动画面
│   └── comicui/
│       ├── src/
│       │   ├── components/         # 搜索、章节、任务等 UI
│       │   ├── pages/              # 主页面与阅读器
│       │   └── lib/                # IPC 类型和阅读进度等工具
│       └── dist/                   # Vite 构建产物
├── package.json                    # Electron 工程配置
└── readme.md
```

## 技术栈

- Electron 31
- Puppeteer Core + Puppeteer in Electron
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion
- JSZip
- `@lesjoursfr/html-to-epub`

## 调试模式

在应用主界面按 `Ctrl+D`（macOS 也支持 `Command+D`）可切换调试模式并打开或关闭开发者工具。

## License

ISC
