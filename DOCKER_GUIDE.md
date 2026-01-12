# 🐳 Docker 开发环境指南

本指南帮助你使用 Docker 搭建 Aura 的开发环境，无需在本地安装 Node.js、pnpm 或 Android SDK。

## 📋 前置要求

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) 或 Docker Engine (Linux)
- 手机上安装 [Expo Go](https://expo.dev/client) App（用于真机测试）
- **Expo Go 版本要求**：SDK 54 需要最新版 Expo Go

## 🚀 快速开始

### 1. 配置环境变量

```bash
# 复制环境变量模板
copy env.example .env

# 编辑 .env 文件，填入你的配置
# - Supabase URL 和 Key
# - Stripe Keys
# - Google Client ID
```

### 2. 启动开发环境

**推荐方式 - 轻量级开发环境：**

```bash
# 首次构建并启动（需要几分钟）
docker-compose up aura-dev --build

# 后续启动（已构建过）
docker-compose up aura-dev

# 后台运行
docker-compose up aura-dev -d
```

**完整环境（包含 Android SDK）：**

```bash
docker-compose up aura-full --build
```

### 3. 连接手机测试

启动后，终端会显示一个二维码和 URL：

1. 打开手机上的 **Expo Go** App
2. 扫描终端中的二维码，或手动输入 `exp://你的IP:8081`
3. 等待 JavaScript bundle 加载完成
4. 开始开发！🎉

## 📱 开发模式说明

### 轻量级模式 (`aura-dev`)

- ✅ 体积小，构建快
- ✅ 支持 Expo Go 真机测试
- ✅ 支持 Web 浏览器开发
- ✅ 使用 Node.js 24 + SDK 54
- ❌ 不支持构建 APK/IPA
- ❌ 不支持 Android 模拟器

**适合场景：** 日常开发、UI 调试、功能开发

### 完整模式 (`aura-full`)

- ✅ 包含完整 Android SDK
- ✅ 可以构建 APK
- ✅ 支持所有开发功能
- ❌ 镜像体积较大（~5GB）
- ❌ 首次构建时间长

**适合场景：** 需要构建发布包、使用原生模块

## 🔧 常用命令

### 基础操作

```bash
# 启动开发服务器（前台运行，可以看到日志）
docker-compose up aura-dev

# 启动开发服务器（后台运行）
docker-compose up aura-dev -d

# 查看日志
docker-compose logs -f aura-dev

# 停止服务
docker-compose down

# 重新构建镜像（修改 Dockerfile 后）
docker-compose build aura-dev

# 强制重新构建（不使用缓存）
docker-compose build --no-cache aura-dev
```

### 进入容器执行命令

```bash
# 进入容器 shell（交互式终端）
docker-compose exec aura-dev sh

# 在容器内你可以执行：
# - pnpm add <package-name>   # 安装依赖
# - pnpm start                # 启动开发服务器
# - pnpm lint                 # 运行 lint
# - exit                      # 退出容器

# 或者一行命令直接执行
docker-compose exec aura-dev pnpm add <package-name>
docker-compose exec aura-dev pnpm lint
```

### 添加新依赖

**方法 1：进入容器安装（推荐）**
```bash
docker-compose exec aura-dev sh
pnpm add <package-name>
exit
```

**方法 2：修改 package.json 后重建**
```bash
# 1. 本地编辑 package.json 添加依赖
# 2. 重新构建镜像
docker-compose down
docker-compose build --no-cache aura-dev
docker-compose up aura-dev
```

### 清理

```bash
# 停止并删除容器
docker-compose down

# 删除所有相关镜像和卷（完全清理）
docker-compose down --rmi all -v

# 清理 Docker 构建缓存
docker builder prune
```

## 🌐 网络配置

### 局域网模式（默认）

手机和电脑需要在同一 WiFi 网络下：

1. 获取电脑的局域网 IP：
   ```bash
   # Windows
   ipconfig
   # 找到 "IPv4 Address"，例如 192.168.1.100
   
   # Mac/Linux
   ifconfig | grep inet
   ```

2. 设置环境变量后启动：
   ```bash
   # Windows CMD
   set HOST_IP=192.168.1.100
   docker-compose up aura-dev
   
   # Windows PowerShell
   $env:HOST_IP="192.168.1.100"
   docker-compose up aura-dev
   ```

3. 在 Expo Go 中手动输入：`exp://192.168.1.100:8081`

### Tunnel 模式（网络受限时使用）

如果局域网无法连接，可以使用 tunnel 模式：

```bash
# 修改 docker-compose.yml 中的 command
command: pnpm start --tunnel
```

- 优点：任何网络环境都能用，无需配置 IP
- 缺点：依赖 ngrok 服务，国内可能连接慢或超时

## 🔥 热重载

代码修改会自动同步到容器内，Metro bundler 会自动重新打包。

如果热重载不工作：

1. 在 Expo Go 中摇晃手机，选择 "Reload"
2. 或者重启容器：`docker-compose restart aura-dev`
3. 清除 Metro 缓存：
   ```bash
   docker-compose exec aura-dev pnpm start --clear
   ```

## ❓ 常见问题

### Q: 构建时下载很慢？

Docker 镜像源配置（修改 Docker Desktop 设置）：
```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

npm 镜像已在 Dockerfile 中配置为淘宝源。

### Q: 端口被占用？

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8082:8081"  # 改为其他端口
```

### Q: ngrok tunnel 连接超时？

国内网络访问 ngrok 可能不稳定，建议使用局域网模式：

```yaml
# docker-compose.yml
command: pnpm start --lan
```

### Q: 如何使用 VS Code 开发？

直接在本地编辑代码，文件会自动同步到容器。推荐安装：

- Docker 扩展
- Remote - Containers 扩展（可选，用于在容器内开发）

### Q: 如何连接真机 USB 调试？

在 `docker-compose.yml` 中取消 `aura-full` 服务的以下注释：

```yaml
privileged: true
devices:
  - /dev/bus/usb:/dev/bus/usb
```

注意：Windows Docker Desktop 不支持 USB 设备直通。

### Q: 报错 "Cannot find module 'xxx'"？

依赖缺失，需要安装：

```bash
# 进入容器安装
docker-compose exec aura-dev pnpm add <missing-package>

# 或重新构建
docker-compose build --no-cache aura-dev
```

### Q: 报错 "pnpm-lock.yaml is not up to date"？

package.json 和 lock 文件不同步，删除 lock 文件重建：

```bash
# 删除本地的 pnpm-lock.yaml
del pnpm-lock.yaml

# 重新构建
docker-compose build --no-cache aura-dev
```

## 📦 构建发布包

### 构建 Android APK

```bash
# 使用完整环境
docker-compose run aura-full pnpm android

# 或者使用 EAS Build（推荐，云端构建）
docker-compose exec aura-dev npx eas build --platform android
```

### 使用 EAS Build（推荐）

EAS Build 在云端构建，无需本地 Android SDK：

```bash
# 登录 Expo
docker-compose exec aura-dev npx eas login

# 构建 Android
docker-compose exec aura-dev npx eas build --platform android

# 构建 iOS（需要 Apple Developer 账号）
docker-compose exec aura-dev npx eas build --platform ios
```

## 🆘 获取帮助

如果遇到问题：

1. 查看容器日志：`docker-compose logs aura-dev`
2. 检查 Docker 状态：`docker ps -a`
3. 进入容器调试：`docker-compose exec aura-dev sh`
4. 完全重建：
   ```bash
   docker-compose down
   docker-compose build --no-cache aura-dev
   docker-compose up aura-dev
   ```
5. 核弹选项（清理一切重来）：
   ```bash
   docker-compose down --rmi all -v
   docker builder prune -f
   docker-compose up aura-dev --build
   ```
