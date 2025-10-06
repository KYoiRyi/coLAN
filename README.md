# coLAN - 局域网聊天应用

<div align="center">

![coLAN Logo](https://via.placeholder.com/200x80/667eea/ffffff?text=coLAN)

**现代化局域网聊天应用 - 让沟通更简单高效**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.8-blue)](https://python.org/)

[功能特色](#功能特色) • [快速开始](#快速开始) • [部署指南](#部署指南) • [使用说明](#使用说明)

</div>

## 📋 项目简介

coLAN 是一个现代化的局域网聊天应用，专为团队协作和朋友间的即时通讯而设计。采用 Next.js + React + Python 技术栈，提供流畅的用户体验和强大的功能。

### 🎯 设计理念

- **简单易用**: 无需复杂配置，开箱即用
- **隐私安全**: 数据完全本地化，无需互联网连接
- **现代美观**: 毛玻璃效果 UI，流畅动画体验
- **高效便捷**: 完整的键盘快捷键支持

## ✨ 功能特色

### 🚀 核心功能
- **实时聊天** - 基于 WebSocket 的实时消息传递
- **聊天室管理** - 创建和加入密码保护的聊天室
- **文件共享** - 支持图片、视频、音频、代码等多种文件类型的上传和预览
- **用户管理** - 在线用户列表和活动状态跟踪
- **持久化存储** - 聊天记录和房间数据自动保存

### 🎨 现代化界面
- **毛玻璃效果**: 优雅的半透明设计
- **响应式布局**: 完美适配各种屏幕尺寸
- **深色模式**: 支持明暗主题切换
- **流畅动画**: Framer Motion 驱动的过渡效果

### ⌨️ 快捷键支持
- **全局快捷键**: `?` 查看帮助，`Esc` 关闭弹窗
- **聊天快捷键**: `Enter` 发送，`Shift+Enter` 换行
- **导航快捷键**: `Ctrl+N` 创建房间，`Ctrl+S` 设置
- **智能提示**: 鼠标悬停显示快捷键

### 🔐 安全特性
- **临时账户**: 无需注册，快速进入
- **永久账户**: 可选的用户名密码登录
- **端到端加密**: 消息传输安全保护
- **本地存储**: 数据完全本地化处理

### 🔧 技术特性
- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全的 JavaScript
- **本地存储** - 基于 JSON 的数据持久化
- **自动清理** - 不活跃用户自动移除（5分钟）
- **会话管理** - 智能的用户会话跟踪
- **文件处理** - 安全的文件上传和存储

## 🛠️ 技术栈

- **前端框架**: Next.js 15 + TypeScript
- **UI 组件**: Tailwind CSS + shadcn/ui
- **动画**: Framer Motion
- **代码高亮**: react-syntax-highlighter
- **图标**: Lucide React
- **文件存储**: 本地文件系统 + JSON 数据持久化
- **实时通信**: HTTP 轮询 + 客户端状态管理

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** 或 **yarn**

### 一键部署

#### Windows
```batch
@echo off
echo === coLAN 一键部署脚本 (Windows) ===
echo.

:: 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo 正在安装项目依赖...
npm install

echo 正在构建项目...
npm run build

echo 正在启动 coLAN 应用...
npm start

echo.
echo === 部署完成! ===
echo 应用地址: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务
pause
```

#### Linux/macOS
```bash
#!/bin/bash

echo "=== coLAN 一键部署脚本 (Linux/macOS) ==="
echo

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

echo "正在安装项目依赖..."
npm install

echo "正在构建项目..."
npm run build

echo "正在启动 coLAN 应用..."
npm start

echo
echo "=== 部署完成! ==="
echo "应用地址: http://localhost:3000"
echo
echo "按 Ctrl+C 停止服务"
```

### 手动安装

1. **克隆项目**
```bash
git clone https://github.com/your-username/colan.git
cd colan
```

2. **安装前端依赖**
```bash
npm install
```

3. **启动应用**
```bash
npm run dev
```

4. **访问应用**
打开浏览器访问: http://localhost:3000

## 📖 使用说明

### 基本操作

1. **进入应用**: 打开浏览器访问应用地址
2. **选择登录**: 临时用户快速进入或创建永久账户
3. **创建房间**: 点击"创建房间"设置名称和密码
4. **开始聊天**: 输入消息，享受实时通讯体验

### 快捷键指南

| 快捷键 | 功能 | 适用场景 |
|--------|------|----------|
| `?` | 显示帮助 | 全局 |
| `Esc` | 关闭弹窗 | 全局 |
| `Enter` | 发送消息 | 聊天页面 |
| `Shift+Enter` | 换行输入 | 聊天页面 |
| `Ctrl+N` | 创建房间 | 仪表板 |
| `Ctrl+S` | 打开设置 | 聊天页面 |
| `R` | 刷新房间列表 | 仪表板 |
| `F` | 显示文件列表 | 聊天页面 |
| `U` | 显示在线用户 | 聊天页面 |
| `L` | 离开房间 | 聊天页面 |
| `/` | 聚焦输入框 | 聊天页面 |

### 高级功能

#### 文件分享
- 点击回形针图标上传文件
- 支持图片、文档等多种格式
- 实时显示上传进度

#### 主题设置
- 点击用户头像打开设置
- 选择明暗主题或跟随系统
- 自定义通知偏好

#### 用户管理
- 查看在线用户列表
- 显示用户活动状态
- 支持临时和永久账户

## 🔧 配置选项

### 环境变量
创建 `.env.local` 文件来自定义配置：

```env
# 服务器端口（默认：3000）
PORT=3000

# 文件上传限制（默认：50MB）
MAX_FILE_SIZE=50MB

# 用户不活跃超时（默认：5分钟）
INACTIVE_TIMEOUT=300
```

## 📁 项目结构

```
coLAN/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API 路由
│   │   │   ├── rooms/      # 房间管理 API
│   │   │   ├── messages/   # 消息 API
│   │   │   ├── upload/     # 文件上传 API
│   │   │   ├── heartbeat/  # 心跳 API
│   │   │   └── ...
│   │   └── ...
│   ├── components/         # React 组件
│   │   ├── ui/            # UI 基础组件
│   │   ├── ColanApp.tsx   # 主应用组件
│   │   ├── FilePreview.tsx # 文件预览组件
│   │   └── ...
│   ├── lib/               # 工具库
│   │   ├── data-store.ts  # 数据存储管理
│   │   └── utils.ts       # 工具函数
│   └── ...
├── public/                # 静态资源
│   └── uploads/          # 上传文件存储
├── data/                 # 数据持久化存储
├── package.json          # 项目配置
└── README.md            # 项目文档
```

## 🔧 配置选项

### 环境变量
创建 `.env.local` 文件来自定义配置：

```env
# 服务器端口（默认：3000）
PORT=3000

# 文件上传限制（默认：50MB）
MAX_FILE_SIZE=50MB

# 用户不活跃超时（默认：5分钟）
INACTIVE_TIMEOUT=300
```

## 📊 API 端点

### 房间管理
- `GET /api/rooms` - 获取所有房间
- `POST /api/rooms` - 创建新房间
- `GET /api/room/[roomId]` - 获取房间信息
- `GET /api/room/[roomId]/users` - 获取房间用户列表

### 消息管理
- `GET /api/messages?room_id=xxx` - 获取房间消息
- `POST /api/messages` - 发送消息

### 用户管理
- `POST /api/join_room` - 加入房间
- `POST /api/leave_room` - 离开房间
- `POST /api/heartbeat` - 更新用户活动状态
- `POST /api/validate_username` - 验证用户名唯一性

### 文件管理
- `POST /api/upload` - 上传文件
- `GET /uploads/[filename]` - 访问上传的文件

## 🔒 安全特性

- **文件类型验证** - 严格的文件类型检查
- **文件大小限制** - 防止大文件攻击
- **用户名验证** - 防止重复和无效用户名
- **会话管理** - 安全的用户会话跟踪

## 🚀 部署

### 生产环境部署
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Docker 部署
```bash
# 构建镜像
docker build -t colan .

# 运行容器
docker run -p 3000:3000 colan
```

## 🎯 功能详解

### 实时通信
- 使用 HTTP 轮询实现实时更新
- 消息轮询间隔：2秒
- 用户列表轮询间隔：5秒
- 心跳发送间隔：30秒

### 文件预览
- **图片**: JPG, PNG, GIF, WebP, SVG, ICO, BMP
- **视频**: MP4, WebM, OGG, MOV, AVI, MKV, WMV, FLV
- **音频**: MP3, WAV, OGG, FLAC, AAC, M4A, WMA
- **代码**: JavaScript, TypeScript, Python, Java, C++, Go, Rust 等

### 数据持久化
- 房间信息：`data/rooms.json`
- 消息记录：`data/messages.json`
- 文件元数据：`data/files.json`
- 自动保存和加载

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题或建议，请创建 GitHub Issue。

---

**coLAN** - 让局域网聊天变得简单而强大 🚀