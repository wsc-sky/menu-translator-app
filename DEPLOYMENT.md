# 菜单翻译应用部署指南

本指南提供了多种快速部署菜单翻译应用的方法。

## 前置要求

- OpenAI API Key
- Git 仓库（推荐推送到 GitHub）

## 部署选项

### 1. Railway 部署（推荐）

Railway 是最简单的部署选项，支持 Docker 和自动部署。

**步骤：**
1. 访问 [Railway](https://railway.app)
2. 使用 GitHub 账号登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择你的仓库
5. 在环境变量中设置：
   - `OPENAI_API_KEY`: 你的 OpenAI API Key
6. Railway 会自动检测 `railway.toml` 配置并部署

**特点：**
- ✅ 免费额度：每月 $5 信用额度
- ✅ 自动 HTTPS
- ✅ 自动域名
- ✅ 支持 Docker
- ✅ 自动重启

### 2. Render 部署

Render 提供简单的 Web 服务部署。

**步骤：**
1. 访问 [Render](https://render.com)
2. 使用 GitHub 账号登录
3. 点击 "New" → "Web Service"
4. 连接你的 GitHub 仓库
5. 配置设置：
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python run.py`
6. 在环境变量中设置：
   - `OPENAI_API_KEY`: 你的 OpenAI API Key
   - `PORT`: 8000
7. 点击 "Create Web Service"

**特点：**
- ✅ 免费层：750小时/月
- ✅ 自动 HTTPS
- ✅ 自动部署
- ✅ 简单配置

### 3. Vercel 部署

Vercel 主要用于前端，但也支持 Python API。

**步骤：**
1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 导入你的 GitHub 仓库
5. Vercel 会自动检测 `vercel.json` 配置
6. 在环境变量中设置：
   - `OPENAI_API_KEY`: 你的 OpenAI API Key
7. 点击 "Deploy"

**特点：**
- ✅ 免费层：慷慨的免费额度
- ✅ 全球 CDN
- ✅ 自动 HTTPS
- ✅ 快速部署

## Docker 部署（自托管）

如果你有自己的服务器，可以使用 Docker 部署。

### 使用 Docker Compose

```bash
# 1. 克隆仓库
git clone <your-repo-url>
cd menu-translator

# 2. 设置环境变量
export OPENAI_API_KEY="your-api-key-here"

# 3. 启动服务
docker-compose up -d
```

### 使用 Docker

```bash
# 1. 构建镜像
docker build -t menu-translator .

# 2. 运行容器
docker run -d \
  -p 8000:8000 \
  -e OPENAI_API_KEY="your-api-key-here" \
  --name menu-translator \
  menu-translator
```

## 本地开发

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 设置环境变量
export OPENAI_API_KEY="your-api-key-here"

# 3. 启动应用
python run.py
```

或者使用提供的脚本：

```bash
# 设置环境变量并启动
./start_with_env.sh
```

## 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `OPENAI_API_KEY` | ✅ | OpenAI API 密钥 |
| `PORT` | ❌ | 服务端口（默认：8000） |

## 故障排除

### 常见问题

1. **OpenAI API Key 错误**
   - 确保 API Key 正确设置
   - 检查 API Key 是否有效
   - 确认账户有足够的信用额度

2. **端口冲突**
   - 更改 `PORT` 环境变量
   - 或在本地使用不同端口

3. **依赖安装失败**
   - 确保 Python 版本 >= 3.8
   - 尝试升级 pip：`pip install --upgrade pip`

### 日志查看

- **Railway**: 在项目面板查看部署日志
- **Render**: 在服务页面查看日志
- **Vercel**: 在项目面板查看函数日志
- **Docker**: `docker logs menu-translator`

## 推荐部署流程

1. **开发阶段**: 使用本地开发环境
2. **测试阶段**: 使用 Railway 或 Render 免费层
3. **生产阶段**: 根据流量选择合适的平台

## 成本对比

| 平台 | 免费额度 | 付费起始价格 | 适用场景 |
|------|----------|--------------|----------|
| Railway | $5/月信用额度 | $5/月 | 小到中型应用 |
| Render | 750小时/月 | $7/月 | 个人项目 |
| Vercel | 慷慨免费额度 | $20/月 | 全球分发需求 |

选择最适合你需求的部署方案！