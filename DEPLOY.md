# 标签静态博客 - 完整部署教程

> 零门槛，纯前端，无需后端服务器。支持 GitHub Pages、Vercel、Cloudflare Pages、Netlify 等多种免费部署方式。

---

## 目录

- [项目结构](#项目结构)
- [本地开发](#本地开发)
- [方式一：GitHub Pages 部署（推荐新手）](#方式一github-pages-部署推荐新手)
- [方式二：Vercel 部署（最简单）](#方式二vercel-部署最简单)
- [方式三：Cloudflare Pages 部署（全球加速）](#方式三cloudflare-pages-部署全球加速)
- [方式四：Netlify 部署（拖拽即可）](#方式四netlify-部署拖拽即可)
- [方式五：自有服务器部署](#方式五自有服务器部署)
- [自定义域名配置](#自定义域名配置)
- [常见问题 FAQ](#常见问题-faq)

---

## 项目结构

```
web9/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件（双主题/响应式/Markdown）
├── js/
│   └── app.js              # 核心逻辑（路由/渲染/搜索/评论）
├── data/
│   └── data.json           # 博客文章数据（32篇示例）
├── scripts/
│   └── fetch-data.js       # 数据获取脚本
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 自动化部署
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── .nojekyll               # 禁用 GitHub Pages Jekyll
├── .gitignore              # Git 忽略文件
└── DEPLOY.md               # 本文件
```

---

## 本地开发

### 环境要求

- Node.js ≥ 16.0.0
- npm 或 pnpm 或 yarn

### 步骤

```bash
# 1. 进入项目目录
cd web9

# 2. 安装依赖
npm install
# 或者更快的方式：
# pnpm install
# yarn

# 3. （可选）获取/更新文章数据
npm run fetch
# 如果远程拉取失败，会自动生成32篇示例文章

# 4. 启动开发服务器
npm run dev
# 浏览器会自动打开 http://localhost:5173

# 5. 构建生产版本
npm run build
# 构建产物在 dist/ 目录
```

### 本地预览构建结果

```bash
# 安装 serve 工具
npm install -g serve

# 预览构建结果
serve -s dist
```

---

## 方式一：GitHub Pages 部署（推荐新手）

### 优点
- 完全免费
- 自带 HTTPS
- 与 GitHub 仓库集成，推送自动部署

### 步骤

#### 第一步：创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 填写仓库名（如 `my-blog`），选择 **Public**
4. 点击 **Create repository**

#### 第二步：上传代码到仓库

```bash
# 初始化 Git（如果还没初始化）
cd web9
git init
git add .
git commit -m "feat: 初始化标签静态博客"

# 关联远程仓库（替换为你的用户名和仓库名）
git remote add origin https://github.com/你的用户名/my-blog.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 第三步：配置 GitHub Pages

1. 打开你的仓库页面
2. 点击顶部 **Settings** → 左侧 **Pages**
3. **Source** 选择 **GitHub Actions**（推荐）

   > 项目已经包含了 `.github/workflows/deploy.yml`，推送代码后会自动执行构建和部署

4. 稍等 1-2 分钟，刷新 Pages 页面，会显示你的博客地址：
   ```
   https://你的用户名.github.io/my-blog/
   ```

#### 手动配置 Pages（不使用 Actions）

如果不想用 Actions，也可以手动部署：

1. 在仓库 **Settings → Pages → Source** 选择 **Deploy from a branch**
2. Branch 选择：`main` 分支，`/ (root)` 目录
3. 点击 **Save**

---

## 方式二：Vercel 部署（最简单）

### 优点
- 全球 CDN 加速，国内访问速度比 GitHub Pages 快
- 推送代码自动部署
- 支持 preview 预览分支
- 完全免费额度足够个人博客使用

### 步骤

#### 方法 A：从 Git 仓库导入（推荐）

1. 打开 [Vercel](https://vercel.com) 官网，用 GitHub 账号登录
2. 点击 **Add New...** → **Project**
3. 选择刚刚上传的博客仓库，点击 **Import**
4. 配置页面，**Framework Preset** 选择 **Vite**
5. Build Command 和 Output Directory 会自动识别，保持默认即可
6. 点击 **Deploy**
7. 等待约 1 分钟，部署完成！会分配一个 `xxx.vercel.app` 域名

#### 方法 B：直接上传 dist 目录

1. 本地运行 `npm run build` 生成 dist 目录
2. 打开 [Vercel Drop](https://vercel.com/drop)
3. 把 dist 文件夹**整个拖进去**
4. 完成！会自动生成访问地址

---

## 方式三：Cloudflare Pages 部署（全球加速）

### 优点
- Cloudflare 全球节点，国内访问速度极佳
- 免费额度非常 generous
- 自带 CDN 和 DDoS 防护
- 支持自定义域名（自带免费 SSL）

### 步骤

1. 打开 [Cloudflare Pages](https://pages.cloudflare.com)，注册/登录账号
2. 点击 **Create a project** → **Connect to Git**
3. 选择 GitHub，授权 Cloudflare 访问你的博客仓库
4. 选择你的博客仓库，点击 **Begin setup**
5. 构建配置：
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
6. 点击 **Save and Deploy**
7. 部署完成后，会分配一个 `xxx.pages.dev` 域名

---

## 方式四：Netlify 部署（拖拽即可）

### 优点
- 新手最友好，拖拽 dist 文件夹即可
- 全球 CDN
- Form 表单支持（但本博客评论用 localStorage，不需要）

### 步骤

#### 方法 A：拖拽部署（30秒搞定）

1. 本地运行 `npm run build`
2. 打开 [Netlify Drop](https://app.netlify.com/drop)
3. 把 dist 文件夹拖到页面上
4. 完成！自动生成随机域名，点击 Site settings 可以修改

#### 方法 B：Git 持续部署

1. 登录 [Netlify](https://www.netlify.com)，用 GitHub 登录
2. 点击 **Add new site** → **Import an existing project**
3. 选择 GitHub，选择你的博客仓库
4. 构建设置：
   - **Build command**：`npm run build`
   - **Publish directory**：`dist`
5. 点击 **Deploy site**

---

## 方式五：自有服务器部署

如果你有自己的云服务器（阿里云、腾讯云、VPS 等）：

### 方法 A：Nginx 静态文件托管

```bash
# 1. 本地构建
npm run build

# 2. 上传 dist 目录到服务器
# 方法一：scp
scp -r dist/* root@你的服务器IP:/var/www/blog/

# 方法二：rsync（更快，增量同步）
rsync -avz --delete dist/ root@你的服务器IP:/var/www/blog/
```

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/blog;
    index index.html;

    # 开启 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    # 静态资源缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA / Hash 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 可选：HTTPS 配置（用 Let's Encrypt 免费证书）
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
}
```

```bash
# 重启 Nginx
nginx -t && systemctl restart nginx
```

### 方法 B：用 Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# 构建镜像
docker build -t my-blog .

# 运行容器
docker run -d -p 80:80 --name blog my-blog
```

---

## 自定义域名配置

无论使用哪种部署方式，都可以绑定自己的域名。

### DNS 配置

以 `blog.example.com` 为例：

| 部署方式 | CNAME 记录值 | A 记录 |
|---------|-------------|--------|
| GitHub Pages | `你的用户名.github.io` | 在 Pages 设置查看 |
| Vercel | `cname.vercel-dns.com` | 76.76.21.21 |
| Cloudflare Pages | 在 Pages 域名设置查看 | - |
| Netlify | 在 Netlify 域名设置查看 | - |
| 自有服务器 | - | 服务器公网 IP |

### 在各平台添加自定义域名

1. 先到域名服务商（如阿里云、Cloudflare）添加 DNS 解析记录
2. 到部署平台的设置里添加自定义域名
3. 等待 SSL 证书自动签发（一般几分钟内）

> **强烈推荐**：域名 DNS 托管到 [Cloudflare](https://cloudflare.com)，免费 CDN + DDoS 防护 + 自动 HTTPS

---

## 常见问题 FAQ

### Q1：部署后页面是空白的？
**A**：检查 `vite.config.js` 里的 `base` 配置。
- 如果用 GitHub Pages 的子路径（如 `user.github.io/my-blog/`），base 应该改成 `'/my-blog/'`
- 如果用自定义域名或根域名，保持 `'./'` 即可

### Q2：刷新页面 404？
**A**：本项目用的是 **Hash 路由**（`#/post/1`），正常不会有这个问题。
如果改成了 History 路由，需要配置 Nginx 的 `try_files $uri /index.html;`

### Q3：文章在哪里修改？
**A**：直接编辑 `data/data.json` 文件，格式参考现有文章。字段说明：
```json
{
  "id": 1,
  "title": "文章标题",
  "summary": "摘要显示在卡片上",
  "coverImage": "封面图URL",
  "author": "作者名",
  "authorAvatar": "作者头像URL",
  "publishDate": "ISO格式时间（2026-07-28T10:30:00Z）",
  "category": "技术/生活/随笔/读书/旅行/美食/思考/影评（8选1）",
  "tags": ["标签1", "标签2", "标签3"],
  "readingMinutes": 10,
  "viewCount": 1000,
  "likeCount": 100,
  "commentCount": 20,
  "content": "Markdown 格式的正文内容"
}
```

### Q4：Markdown 支持哪些语法？
**A**：本项目内置原生正则 Markdown 渲染器，支持：
- ✅ 标题 `# ~ ######`
- ✅ 粗体 `**文字**` / 斜体 `*文字*` / 删除线 `~~文字~~`
- ✅ 链接 `[文字](URL)` / 图片 `![alt](URL)`
- ✅ 有序列表 / 无序列表
- ✅ 引用 `> 引用内容`
- ✅ 行内代码 `` `code` `` / 代码块 ` ``` `
- ✅ 表格
- ✅ 分割线 `---`

### Q5：评论存在哪里？
**A**：评论使用浏览器的 `localStorage` 存储，每篇文章独立。
- 优点：零成本，不需要后端
- 缺点：用户换浏览器/清缓存就没了，不同用户看不到互相的评论

> 如果需要真正的多用户评论系统，可以集成 **Giscus**（基于 GitHub Discussions）或 **Valine** / **Waline**

### Q6：主题切换能记住吗？
**A**：可以。主题偏好保存在 `localStorage`，下次访问自动应用。
首次访问时还会自动检测系统偏好（浅色/深色模式）。

### Q7：搜索支持哪些内容？
**A**：输入关键词 300ms 防抖搜索，覆盖：
- 标题
- 摘要
- 正文内容
- 标签
- 作者名

### Q8：如何修改分类？
**A**：编辑两个地方：
1. `index.html` 里的 `.category-tabs` 导航（8个分类Tab）
2. `js/app.js` 里的 `categories` 和 `categoryEmojis` 常量

### Q9：如何添加新的页面路由？
**A**：目前支持5种路由：
| 路由 | 说明 |
|------|------|
| `#/` | 首页 |
| `#/post/<id>` | 文章详情页 |
| `#/category/<分类名>` | 分类筛选 |
| `#/tag/<标签名>` | 标签筛选 |
| `#/archive/<YYYY-MM>` | 归档筛选 |

要加新路由，修改 `js/app.js` 里的 `parseHash()` 和 `handleRoute()` 函数。

### Q10：国内访问 GitHub Pages 慢怎么办？
**A**：推荐方案：
1. 首选 **Vercel** 或 **Cloudflare Pages** 部署
2. 域名解析到 Cloudflare，开启 CDN
3. 使用国内的部署平台（如 Gitee Pages、腾讯云静态网站托管）

---

## 写在最后

感谢使用这个标签静态博客模板！🎉

如果有任何问题或建议，欢迎：
- 提交 Issue / PR
- 或者在博客评论区留言（先用起来再说~）

**祝你写作愉快！** ✍️✨
