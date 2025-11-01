# Profeed - 翻译校对工具

一个简单的 React 应用，用于校对和编辑特定结构的翻译 JSON 文件。

## 功能特性

- 📁 支持拖拽上传 JSON 文件
- ✏️ 可视化编辑翻译内容
- 🔄 支持嵌套 JSON 结构
- 💾 下载校对后的文件
- 📱 响应式设计

## 使用方法

1. 启动开发服务器：

   ```bash
   npm install
   npm run dev
   ```

2. 打开浏览器访问 `http://localhost:3000`

3. 上传你的 JSON 翻译文件

4. 编辑翻译内容

5. 下载校对后的文件

## 支持的 JSON 格式

支持多层嵌套的 JSON 结构，例如：

```json
{
  "common": {
    "buttons": {
      "save": "保存",
      "cancel": "取消"
    },
    "messages": {
      "success": "操作成功"
    }
  },
  "home": {
    "title": "首页",
    "description": "欢迎使用"
  }
}
```

## 构建

```bash
npm run build
```

构建后的文件将在 `dist` 目录中。

## 技术栈

- React 18
- TypeScript
- Vite
- 原生 CSS（无额外 UI 库）
