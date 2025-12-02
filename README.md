# Marine Food Products - Hugo Website

现代化的海鲜食品公司官方网站，使用 Hugo 静态网站生成器构建。

## 功能特性

- 🎨 现代化、响应式设计
- 📱 移动端友好
- ⚡ 快速加载
- 🌐 多页面支持（首页、关于我们、产品、质量控制、联系我们）
- 📧 联系表单
- 🎯 SEO 友好

## 页面结构

- **首页 (Home)**: 展示公司品牌和主要特色
- **关于我们 (About Us)**: 公司介绍、工厂规模、实验室和市场信息
- **产品 (Products)**: 冷冻鱿鱼产品展示
- **质量控制 (Quality Control)**: 质量保证信息
- **联系我们 (Contact)**: 联系表单和公司信息

## 安装和运行

### 前置要求

确保已安装 [Hugo](https://gohugo.io/) (推荐使用扩展版本)

### 安装 Hugo

**macOS:**
```bash
brew install hugo
```

**Linux/Windows:**
请参考 [Hugo 官方安装指南](https://gohugo.io/installation/)

### 运行开发服务器

```bash
# 在项目根目录运行
hugo server

# 或者使用以下命令以查看草稿内容
hugo server -D
```

访问 http://localhost:1313 查看网站

### 构建静态网站

```bash
# 默认构建（适用于根目录部署）
hugo

# 或者指定 baseURL（适用于子目录部署）
hugo --baseURL "/your-path/"
```

生成的静态文件将在 `public/` 目录中。

### 灵活部署说明

本项目已配置为支持灵活部署，无需修改配置文件：

- **本地开发**: 直接运行 `hugo server`，访问 `http://localhost:1313`
- **根目录部署**: 运行 `hugo` 或 `hugo --baseURL "/"`，部署到服务器根目录
- **子目录部署**: 运行 `hugo --baseURL "/your-path/"`，部署到服务器的子目录

所有链接和资源路径都会根据 baseURL 自动适配，无论是根目录还是子目录都能正常工作。

## 项目结构

```
ocean/
├── config.toml          # Hugo 配置文件
├── content/             # 内容文件
│   ├── _index.md        # 首页内容
│   ├── about.md         # 关于我们
│   ├── products.md      # 产品
│   ├── quality-control.md # 质量控制
│   └── contact.md       # 联系我们
├── themes/
│   └── ocean-theme/     # 自定义主题
│       ├── layouts/     # 模板文件
│       ├── static/      # 静态资源（CSS, JS）
│       └── ...
└── public/              # 构建输出目录（运行 hugo 后生成）
```

## 自定义配置

编辑 `config.toml` 文件来修改网站配置：

- 公司名称和联系信息
- 导航菜单
- 网站标题和描述

## 主题定制

主题文件位于 `themes/ocean-theme/` 目录：

- `static/css/style.css` - 样式文件
- `static/js/main.js` - JavaScript 文件
- `layouts/` - HTML 模板文件

## 部署

### Netlify

1. 将代码推送到 Git 仓库
2. 在 Netlify 中连接仓库
3. 构建命令: `hugo`
4. 发布目录: `public`

### GitHub Pages

```bash
hugo
cd public
git init
git add .
git commit -m "Deploy site"
git push -f git@github.com:username/username.github.io.git main
```

### 其他静态托管服务

运行 `hugo` 构建网站，然后将 `public/` 目录的内容上传到你的托管服务。

## 浏览器支持

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 许可证

本项目为 Marine Food Products Co., Ltd. 所有。

## 联系方式

如有问题或建议，请联系：
- Email: info@marinefood.com
- Phone: +86 123 4567 8900

