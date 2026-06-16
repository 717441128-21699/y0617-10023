## 1. 架构设计

本项目为纯前端单页应用，无需后端服务，所有功能均在浏览器端完成。

```mermaid
graph TD
    "浏览器层" --> "UI 视图层 (React 组件)"
    "UI 视图层" --> "状态管理层 (Zustand)"
    "状态管理层" --> "业务逻辑层 (Utils/Hooks)"
    "业务逻辑层" --> "第三方库"
    "第三方库" --> "marked (Markdown解析)"
    "第三方库" --> "highlight.js (代码高亮)"
    "第三方库" --> "html2pdf.js (PDF导出)"
```

## 2. 技术描述

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS 3 + CSS 自定义属性（用于主题变量）
- **状态管理**: Zustand
- **核心依赖库**:
  - `marked`: Markdown 语法解析为 HTML
  - `highlight.js`: 代码块语法高亮着色
  - `html2pdf.js`: 将 HTML 渲染内容导出为 PDF
  - `lucide-react`: 图标库

## 3. 目录结构

```
src/
├── components/
│   ├── Toolbar.tsx          # 顶部工具栏（主题切换、导出、复制）
│   ├── Outline.tsx          # 左侧文档大纲
│   ├── Editor.tsx           # Markdown 编辑区
│   └── Preview.tsx          # HTML 预览区
├── hooks/
│   ├── useMarkdown.ts       # Markdown 解析与状态管理 Hook
│   ├── useOutline.ts        # 大纲提取 Hook
│   └── useTheme.ts          # 主题切换 Hook
├── utils/
│   ├── exportPdf.ts         # PDF 导出工具
│   ├── copyHtml.ts          # HTML 复制工具
│   └── defaultContent.ts    # 默认 Markdown 示例内容
├── types/
│   └── index.ts             # TypeScript 类型定义
├── styles/
│   └── themes.css           # CSS 自定义属性（亮/暗主题配色）
├── App.tsx                  # 主应用组件
├── main.tsx                 # 应用入口
└── index.css                # 全局样式
```

## 4. 核心数据模型

### 4.1 应用状态

```typescript
interface AppState {
  markdown: string;           // 当前编辑的 Markdown 原文
  html: string;               // 解析渲染后的 HTML
  outline: HeadingItem[];     // 文档大纲
  theme: 'light' | 'dark';    // 当前主题
}

interface HeadingItem {
  id: string;                 // 标题锚点 ID
  text: string;               // 标题文本
  level: 1 | 2 | 3 | 4 | 5 | 6; // 标题层级
}
```
