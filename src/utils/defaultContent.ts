export const defaultMarkdown = `# 欢迎使用在线 Markdown 编辑器

这是一个功能完备的纯浏览器端 Markdown 编辑器，所有功能均在本地完成，无需服务器支持。

## 核心功能

### 实时编辑与预览

左侧是编辑区，右侧是实时渲染的 HTML 预览。你可以尝试编辑下面的内容：

- **粗体文字** 和 *斜体文字*
- ~~删除线~~ 和 \`行内代码\`
- [超链接示例](https://example.com)

### 代码块语法高亮

支持多种编程语言的语法高亮：

\`\`\`typescript
interface User {
  name: string;
  age: number;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const user: User = {
  name: "Alice",
  age: 30,
  email: "alice@example.com"
};

console.log(greet(user));
\`\`\`

\`\`\`python
def fibonacci(n):
    """计算斐波那契数列"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
\`\`\`

\`\`\`javascript
// JavaScript 示例
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((acc, n) => acc + n, 0);

console.log("Doubled:", doubled);
console.log("Sum:", sum);
\`\`\`

### 表格

| 功能 | 描述 | 状态 |
|------|------|------|
| 实时预览 | 编辑后即时渲染 | ✅ |
| 语法高亮 | 代码块着色显示 | ✅ |
| 文档大纲 | 自动生成导航 | ✅ |
| 主题切换 | 亮色/暗色模式 | ✅ |
| PDF 导出 | 下载为 PDF | ✅ |
| HTML 复制 | 一键复制 HTML | ✅ |

### 引用

> 好的工具应该让复杂的事情变得简单。
> 
> —— 某位程序员

### 列表

#### 有序列表

1. 在左侧编辑区输入 Markdown
2. 右侧自动渲染为 HTML
3. 使用顶部工具栏切换主题或导出文件

#### 无序列表

- 支持所有标准 Markdown 语法
- 纯浏览器端运行，数据不上传
- 响应式设计，适配各种屏幕

### 任务列表

- [x] 完成 Markdown 解析功能
- [x] 实现代码语法高亮
- [x] 添加文档大纲导航
- [x] 实现主题切换
- [x] 支持 PDF 导出
- [ ] 添加更多功能...

### 分割线

---

## 文档大纲

左侧的大纲栏会根据标题层级自动生成导航树，点击任意标题即可跳转到对应位置。

### 二级标题示例 1

内容...

### 二级标题示例 2

更多内容...

#### 三级标题示例

嵌套内容...

## 开始使用

现在，你可以开始编辑左侧的 Markdown 内容了！点击顶部工具栏的按钮可以：

1. 🌓 切换亮色/暗色主题
2. 📄 导出为 PDF 文件
3. 📋 复制渲染后的 HTML

祝使用愉快！ 🎉
`;
