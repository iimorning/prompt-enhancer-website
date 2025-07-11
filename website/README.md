# 点石成金 Prompt Enhancer 官网

这是点石成金 Chrome 扩展的官方网站，用于展示产品功能和提供下载链接。

## 项目结构

```
website/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # JavaScript 功能
├── vercel.json         # Vercel 部署配置
└── README.md           # 项目说明
```

## 功能特性

- 🌍 **多语言支持**: 中文/英文切换
- 📱 **响应式设计**: 适配桌面端和移动端
- ✨ **现代化UI**: 玻璃态效果、动态背景、平滑动画
- 🚀 **性能优化**: 轻量级、快速加载
- 🔒 **安全配置**: 包含安全头部配置

## 本地开发

1. 克隆或下载项目文件
2. 使用任意 HTTP 服务器运行，例如：
   ```bash
   # 使用 Python
   python -m http.server 8000
   
   # 使用 Node.js
   npx serve .
   
   # 使用 Live Server (VS Code 扩展)
   ```
3. 在浏览器中访问 `http://localhost:8000`

## 部署到 Vercel

### 方法一：通过 GitHub（推荐）

1. 将 `website` 文件夹内容推送到 GitHub 仓库
2. 访问 [vercel.com](https://vercel.com)
3. 使用 GitHub 账号登录
4. 点击 "New Project"
5. 选择您的 GitHub 仓库
6. 配置项目设置：
   - Framework Preset: Other
   - Root Directory: `./` (如果整个仓库就是网站文件)
7. 点击 "Deploy"

### 方法二：通过 Vercel CLI

1. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 在 website 文件夹中运行：
   ```bash
   vercel
   ```

3. 按照提示完成部署

### 方法三：拖拽部署

1. 访问 [vercel.com](https://vercel.com)
2. 将 `website` 文件夹直接拖拽到 Vercel 页面
3. 等待部署完成

## 自定义域名

部署完成后，您可以：

1. 在 Vercel 项目设置中添加自定义域名
2. 配置 DNS 记录指向 Vercel
3. Vercel 会自动配置 SSL 证书

## 环境变量

目前项目不需要环境变量，所有配置都在客户端完成。

## 性能优化

- 使用了现代 CSS 特性（Grid、Flexbox、CSS 变量）
- 图片和资源文件缓存配置
- 压缩和优化的代码
- 懒加载和交互观察器

## 浏览器支持

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 更新网站

1. 修改相应的 HTML、CSS 或 JS 文件
2. 提交更改到 GitHub（如果使用 GitHub 部署）
3. Vercel 会自动重新部署

## 故障排除

### 常见问题

1. **语言切换不工作**
   - 检查 JavaScript 控制台是否有错误
   - 确保所有语言相关的元素都有正确的 ID

2. **样式显示异常**
   - 检查 CSS 文件是否正确加载
   - 确保浏览器支持所使用的 CSS 特性

3. **部署失败**
   - 检查 vercel.json 配置是否正确
   - 确保所有文件路径都是正确的

### 联系支持

如果遇到问题，请：
1. 检查浏览器控制台的错误信息
2. 查看 Vercel 部署日志
3. 联系开发团队

## 许可证

© 2024 点石成金 Prompt Enhancer. 保留所有权利。
