# Aura - React Native/Expo Development Environment
# SDK 54 需要 Node.js 20+
FROM node:24-bullseye

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    openjdk-17-jdk \
    watchman \
    && rm -rf /var/lib/apt/lists/*

# 设置 JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# 安装 Android SDK Command Line Tools
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    cd ${ANDROID_HOME}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip && \
    unzip -q cmdline-tools.zip && \
    rm cmdline-tools.zip && \
    mv cmdline-tools latest

# 接受 Android SDK 许可证并安装必要组件
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "emulator"

# 配置 npm 使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm
RUN npm install -g pnpm@latest

# 配置 pnpm 使用淘宝镜像
RUN pnpm config set registry https://registry.npmmirror.com

# 安装 Expo CLI
RUN npm install -g expo-cli @expo/ngrok

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package.json pnpm-lock.yaml* ./

# 安装项目依赖
RUN pnpm install --frozen-lockfile || pnpm install

# 复制项目文件
COPY . .

# 暴露 Expo 开发服务器端口
# Metro bundler
EXPOSE 8081
# Expo DevTools
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# 默认启动命令
CMD ["pnpm", "start", "--tunnel"]

