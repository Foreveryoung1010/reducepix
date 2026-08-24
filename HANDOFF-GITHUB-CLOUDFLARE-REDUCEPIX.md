# ReducePix：GitHub + Cloudflare Pages 迁移交接文档

> 交给下一位 Agent 使用。目标：把当前 ReducePix 源码推送到用户自己的 GitHub，并连接用户自己的 Cloudflare Pages，获得 Cloudflare 提供的 *.pages.dev 免费项目子域名。迁移完成前，不要删除当前 Sites 项目。

## 1. 任务目标

目标架构：

~~~text
本地源码
  ↓
GitHub 仓库 main 分支
  ↓（Cloudflare Pages Git integration）
用户自己的 Cloudflare Pages 项目
  ↓
<project-name>.pages.dev
  ↓（以后可选）
用户购买并绑定的正式域名
~~~

完成标准：

- 源码已进入用户自己的 GitHub 仓库。
- Cloudflare Pages 已连接该 GitHub 仓库。
- Pages 构建命令和输出目录正确。
- 生产分支为 main。
- 获得新的 *.pages.dev 网址。
- 首页、隐私页、条款页、robots.txt、sitemap.xml 均可访问。
- canonical、Open Graph、JSON-LD、sitemap 全部指向新网址。
- GSC、Bing、IndexNow 状态已明确记录，不能假设已完成。
- 当前 Sites 网址仍可作为回滚和对照版本。

## 2. 当前项目状态

项目目录：

~~~text
D:\AI项目\CODEX\出海建站\图片工具站
~~~

当前站点：

- 品牌：ReducePix
- 当前 Sites 网址：https://reducepix.lurassica.chatgpt.site/
- 当前 Sites 状态：Public / Active
- 当前 Sites 版本：v11
- 当前 Pages 项目：尚未创建
- 当前 GitHub 仓库：尚未配置
- 当前正式域名：没有
- Google Search Console：未认证
- Bing Webmaster Tools：未认证
- IndexNow：未配置

当前 Sites 是可用的生产回退版本。迁移期间不要删除、暂停或改动其访问权限。

## 3. 当前源码结构

| 文件 | 用途 |
|---|---|
| index.html | 首页、压缩工具、SEO 元信息、JSON-LD、FAQ |
| privacy.html | 隐私政策页面 |
| terms.html | 使用条款页面 |
| robots.txt | 搜索引擎抓取规则和 sitemap 地址 |
| sitemap.xml | 当前公开页面 sitemap |
| _headers | 安全响应头、CSP、Referrer Policy 等 |
| favicon.svg | 网站图标 |
| build.mjs | 构建到 dist/ |
| server-entry.mjs | 原 Sites Worker runtime 入口，Pages 静态托管通常不需要 |
| .openai/hosting.json | 当前 Sites 项目关联信息，不是 GitHub 或 Cloudflare Pages 配置 |
| CLOUDFLARE-SEO-LEGAL-CHECKLIST.md | SEO、法规和发布检查表 |

当前 Git 状态：

- 分支：main
- 最新提交：8a4d7f1b79ce80eb03378bd06bc972a2261655ea
- 当前本地仓库已有一个名为 sites 的旧远程，指向 Sites 管理的内部源码仓库。
- 当前没有用户自己的 GitHub origin 远程。

注意：本文件夹是一个嵌套 Git 仓库。操作时以本目录下的 .git 为准，不要误把上级目录 D:\AI项目\CODEX\出海建站 当成项目根目录。

## 4. 迁移前安全检查

### 4.1 先确认用户输入

需要用户提供或在浏览器中完成：

- GitHub 用户名或组织名。
- GitHub 仓库名称，例如 reducepix。
- GitHub 仓库可设为 Private；不要求公开源码。
- Cloudflare 账号登录状态。
- Cloudflare Pages 项目名称，优先尝试 reducepix。

不要让用户把 GitHub PAT、Cloudflare API Token、密码直接写进交接文档、聊天记录或 URL。

### 4.2 检查敏感信息

执行：

~~~powershell
git status
git remote -v
git grep -n -I -E "(api[_-]?key|secret|password|token|BEGIN PRIVATE KEY)" -- . ':!HANDOFF-GITHUB-CLOUDFLARE-REDUCEPIX.md'
~~~

如果发现真实密钥：

1. 立即停止推送。
2. 从文件中移除密钥。
3. 如果密钥曾经提交过，先轮换或撤销密钥。
4. 再清理 Git 历史后推送。

GitHub 官方警告，不要把密码、API key 或其他敏感信息推送到远程仓库：
https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github

### 4.3 检查 Sites 旧远程

当前 sites 远程只用于旧 Sites 部署，不要把它当成 GitHub 远程。

迁移初期可保留但改名：

~~~powershell
git remote rename sites sites-legacy
~~~

迁移完成并确认不再需要从该目录回推 Sites 后，再删除：

~~~powershell
git remote remove sites-legacy
~~~

不要把 Sites 写入凭据保存到 Git 配置或脚本中。

## 5. 推送到 GitHub

建议用户先在 GitHub 创建一个空仓库：

- Repository name：reducepix
- Visibility：建议先 Private
- 不要预先勾选 README、.gitignore 或 License，避免首次推送产生无关合并冲突。

在项目目录执行：

~~~powershell
git remote add origin https://github.com/<OWNER>/reducepix.git
git push -u origin main
~~~

如果 origin 已存在：

~~~powershell
git remote set-url origin https://github.com/<OWNER>/reducepix.git
git push -u origin main
~~~

认证方式优先使用：

- GitHub Desktop 登录
- GitHub CLI gh auth login
- 系统凭据管理器

不要把 PAT 写进这种 URL：

~~~text
https://TOKEN@github.com/OWNER/reducepix.git
~~~

完成后确认：

~~~powershell
git remote -v
git branch --show-current
git log -1 --oneline
~~~

GitHub 仓库至少应包含：

~~~text
index.html
privacy.html
terms.html
robots.txt
sitemap.xml
_headers
favicon.svg
package.json
build.mjs
~~~

## 6. 连接 Cloudflare Pages

推荐使用 Git integration，不要使用 Direct Upload。Cloudflare Pages 连接 GitHub 后，可以在推送代码时自动构建和部署，并提供分支预览和部署状态。

Cloudflare 控制台路径：

~~~text
Workers & Pages
  → Create application
  → Pages
  → Connect to Git
  → GitHub
  → 选择 reducepix 仓库
~~~

建议配置：

| 配置项 | 值 |
|---|---|
| Production branch | main |
| Root directory | /，即仓库根目录 |
| Build command | npm run build |
| Build output directory | dist |
| Framework preset | None / Other |
| Node version | Cloudflare 可用的 Node LTS；当前项目没有第三方依赖 |

Cloudflare Git integration 的重要限制：Git 集成项目之后不能直接切换成 Direct Upload。初始部署方式要先选对。

官方文档：
https://developers.cloudflare.com/pages/configuration/git-integration/

## 7. pages.dev 免费项目地址

如果 Pages 项目名称可用，优先尝试：

~~~text
reducepix.pages.dev
~~~

如果已被占用，可选：

~~~text
reducepix-tool.pages.dev
reducepix-compressor.pages.dev
reducepix-image.pages.dev
~~~

注意：

- pages.dev 是 Cloudflare 提供的项目子域名，不是用户拥有的独立域名。
- 不能保证 reducepix.pages.dev 一定可用。
- 项目名会影响默认 pages.dev 地址。
- 以后仍可以绑定正式域名。
- 新 Pages 项目会显示在用户自己的 Cloudflare Workers & Pages 控制台。

Cloudflare Pages 会为成功部署的项目提供唯一的 *.pages.dev 地址；自有域名需要单独配置。

官方文档：
https://developers.cloudflare.com/pages/tutorials/forms/

## 8. 迁移后的 SEO 地址处理

第一次 Pages 构建可能仍然带有旧 Sites canonical：

~~~text
https://reducepix.lurassica.chatgpt.site/
~~~

不能把这个状态当作最终发布完成。获得新的 Pages 地址后，必须更新：

- index.html 的 canonical
- index.html 的 og:url
- index.html 的 JSON-LD URL
- privacy.html canonical
- terms.html canonical
- robots.txt 的 sitemap 地址
- sitemap.xml 所有 loc
- Open Graph 网站地址
- CLOUDFLARE-SEO-LEGAL-CHECKLIST.md 中的当前 hostname

替换后搜索残留：

~~~powershell
Select-String -Path *.html,*.txt,*.xml,*.md,*.json,*.mjs -Pattern "chatgpt.site|pixelcrate" -CaseSensitive:$false
~~~

目标是：

- 生产文件中不再出现旧 pixelcrate 品牌。
- canonical 与实际 Pages 地址完全一致。
- sitemap 与 canonical 使用同一主机名。
- privacy.html 和 terms.html 使用 /privacy、/terms 作为主地址。

Cloudflare Pages 默认会把匹配到的 .html 路由重定向到无扩展名路径。

官方文档：
https://developers.cloudflare.com/pages/configuration/serving-pages/

## 9. Pages 静态构建注意事项

当前 build.mjs 是为 Sites 兼容性准备的，除了复制静态文件，还会把：

- .openai/hosting.json
- server-entry.mjs 的构建副本

复制到 dist/。

迁移到自有 Cloudflare Pages 时，建议 Agent 重新检查并考虑：

1. .openai/hosting.json 只保留在源码工作区，不复制成公开静态文件。
2. server-entry.mjs 是 Sites runtime 入口，纯 Pages 静态部署通常不需要。
3. dist/ 只保留真正需要公开访问的静态资源。
4. 运行 npm run build 后检查 dist/ 内容，再推送部署。

不要在没有验证的情况下删除 .openai/hosting.json；如果还需要保留当前 Sites 回滚能力，应先确认 Sites 项目不再需要该文件。

构建检查：

~~~powershell
npm run build
Get-ChildItem dist -Recurse
~~~

## 10. 发布后的验收

假设新地址为：

~~~text
https://<PAGES_PROJECT>.pages.dev
~~~

检查：

~~~powershell
curl.exe --compressed -sS -o NUL -w "%{http_code} %{content_type}" https://<PAGES_PROJECT>.pages.dev/
curl.exe --compressed -sS -o NUL -w "%{http_code} %{content_type}" https://<PAGES_PROJECT>.pages.dev/privacy
curl.exe --compressed -sS -o NUL -w "%{http_code} %{content_type}" https://<PAGES_PROJECT>.pages.dev/terms
curl.exe --compressed -sS -o NUL -w "%{http_code} %{content_type}" https://<PAGES_PROJECT>.pages.dev/robots.txt
curl.exe --compressed -sS -o NUL -w "%{http_code} %{content_type}" https://<PAGES_PROJECT>.pages.dev/sitemap.xml
~~~

预期全部为 200。

页面检查：

- 首页标题包含 ReducePix。
- 上传图片、压缩、下载功能正常。
- JPG、PNG、WebP 处理正常。
- 批量图片处理正常。
- 目标 KB 和最大尺寸设置正常。
- 首页不出现 PixelCrate。
- /privacy、/terms 可访问。
- robots.txt 指向新 sitemap。
- sitemap.xml 只列出新主机名。
- canonical、OG、JSON-LD 指向新主机名。
- 手机和桌面布局正常。
- 浏览器开发者工具无关键 JavaScript 错误。

不要只看 Cloudflare 显示“部署成功”；必须实际打开新网址并执行核心功能。

## 11. 自定义域名

目前用户没有正式域名。可以先使用 pages.dev，以后再购买域名。

如果以后有正式域名：

~~~text
Cloudflare Workers & Pages
  → 选择 Pages 项目
  → Custom domains
  → Set up a domain
~~~

Cloudflare 会提供 DNS 配置方式。根域名通常需要将域名作为 Cloudflare zone 并配置 nameservers；子域名可以通过 CNAME 指向 Pages 子域名。

官方文档：
https://developers.cloudflare.com/pages/configuration/custom-domains/

绑定正式域名后，要再次更新并部署：

- canonical
- og:url
- JSON-LD
- robots.txt
- sitemap.xml
- GSC/Bing 属性
- 隐私政策中的实际网址

## 12. GSC 和 Bing Webmaster Tools

当前状态：未认证、未提交 sitemap。

### Google Search Console

建议等正式域名确定后再操作：

1. 在 GSC 添加最终网址属性。
2. 使用 DNS、HTML 文件或 meta tag 验证所有权。
3. 提交：

~~~text
https://<FINAL_HOST>/sitemap.xml
~~~

4. 使用 URL Inspection 检查首页、隐私页、条款页。
5. 确认 Google 看到的 canonical 是最终域名。

Google 的 sitemap 提交只是告诉 Google sitemap 在哪里，不代表所有页面一定被收录。

官方文档：
https://support.google.com/webmasters/answer/7451001?hl=en

### Bing Webmaster Tools

1. 添加最终网址。
2. 使用 DNS、XML 文件、meta tag 或 CNAME 完成验证。
3. 提交同一个 sitemap。
4. 使用 URL Inspection 查看抓取和索引状态。

Bing 支持直接从已验证的 GSC 导入站点，也支持手动验证。

官方文档：
https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b

## 13. IndexNow

IndexNow 是通知 Bing 和其他参与搜索引擎“某个 URL 新增、更新或删除”的协议。

它不是：

- GSC 验证
- Bing 站点验证
- sitemap
- 排名保证
- 收录保证

配置通常需要：

1. 生成 IndexNow key。
2. 在网站根目录放置 key 文件。
3. 提交新增或变更的公开 URL。
4. 在 Bing Webmaster Tools 中检查接收状态。

当前项目没有 key 文件，也没有提交 URL。建议最终域名确定后再配置，避免先为 chatgpt.site 或临时 pages.dev 地址配置，之后迁移又重复处理。

IndexNow 可以加快搜索引擎发现变更，但不保证抓取或收录。

官方文档：
https://www.bing.com/indexnow/getstarted

## 14. 法规和推广注意事项

上线广告或 SEO 推广前需要补齐：

- 运营者名称。
- 可监控的隐私联系邮箱。
- 适用法律和管辖信息。
- 数据保留说明。
- Cloudflare 基础设施数据说明。
- 支持请求和删除请求流程。
- 未来添加 Analytics、广告或第三方脚本时的同意机制。

当前页面可以诚实说明“图片在浏览器本地处理”，但不要写成“网站完全不处理任何个人数据”。普通访问请求仍可能产生 IP、浏览器和请求时间等技术数据。

不要在 Google/Bing 广告中使用未经证明的表述，例如：

- “绝对不会收集任何数据”
- “永久免费”
- “100% 安全”
- “保证压缩到指定大小”
- “保证隐私”

当前工具没有账号、支付、上传队列和图片存储，广告内容应保持与实际功能一致。

## 15. 迁移完成后的回退策略

在新 Pages 地址连续验证通过前：

- 保留当前 Sites 网址。
- 不删除当前 Sites 项目。
- 不把旧 Sites URL 立即改成无法访问的状态。
- 不在搜索引擎中同时提交两个不同 canonical 的 sitemap。

当 Pages 版本稳定后，再决定：

1. 继续保留 Sites 作为备用版本；或
2. 将 Sites 访问权限改为私有；或
3. 删除 Sites。

删除 Sites 是永久操作，不能恢复。除非确认 Pages、GitHub、域名和 SEO 迁移全部完成，否则不要删除。

## 16. 最终交付清单

- [ ] GitHub 仓库创建完成。
- [ ] GitHub main 分支存在最新源码。
- [ ] 没有密钥、密码、token 被提交。
- [ ] Cloudflare Pages GitHub integration 已连接。
- [ ] Pages 生产分支为 main。
- [ ] 构建命令为 npm run build。
- [ ] 输出目录为 dist。
- [ ] *.pages.dev 地址可访问。
- [ ] 首页压缩功能通过测试。
- [ ] /privacy 返回 200。
- [ ] /terms 返回 200。
- [ ] /robots.txt 返回 200。
- [ ] /sitemap.xml 返回 200。
- [ ] 新页面没有旧 PixelCrate 文案。
- [ ] 所有 canonical 指向新地址。
- [ ] sitemap 指向新地址。
- [ ] GSC 状态已记录。
- [ ] Bing Webmaster Tools 状态已记录。
- [ ] IndexNow 是否配置已记录。
- [ ] 当前 Sites 版本仍可回退。
- [ ] 若绑定正式域名，已再次更新 SEO 地址并重新部署。

## 17. 交给 Agent 的第一条任务指令

可以把下面这段直接发给下一位 Agent：

~~~text
请阅读项目目录中的 HANDOFF-GITHUB-CLOUDFLARE-REDUCEPIX.md，并按文档把 ReducePix 从当前 Codex Sites 迁移到我的 GitHub 和 Cloudflare Pages。

目标：
1. 将当前项目推送到我的 GitHub 仓库。
2. 在我的 Cloudflare 账号创建 Pages 项目并连接 GitHub。
3. 使用 npm run build，输出目录 dist。
4. 获得可用的 <project-name>.pages.dev 地址。
5. 根据实际新地址更新 canonical、Open Graph、JSON-LD、robots.txt 和 sitemap.xml。
6. 验证首页、图片压缩、隐私页、条款页、robots.txt、sitemap.xml。
7. 不要删除当前 Sites 项目，不要把任何 token、密码或 API key 写入仓库。
8. 不要声称 GSC、Bing 或 IndexNow 已完成，除非实际完成并提供证据。
9. 完成后报告 GitHub 仓库地址、Cloudflare Pages 项目名、pages.dev 地址、构建日志摘要和所有未完成事项。
~~~

