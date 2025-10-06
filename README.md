# coLAN - Collaborative Local Area Network Chat

一个现代化的实时聊天应用程序，专为局域网环境设计，提供完整的聊天室功能和文件共享能力。

## ✨ 特性

### 🚀 核心功能
- **实时聊天** - 基于 HTTP 轮询的实时消息传递
- **聊天室管理** - 创建和加入密码保护的聊天室
- **文件共享** - 支持图片、视频、音频、代码等多种文件类型的上传和预览
- **用户管理** - 在线用户列表和活动状态跟踪
- **持久化存储** - 聊天记录和房间数据自动保存

### 🎨 用户体验
- **现代化界面** - 基于 Tailwind CSS 的美观 UI 设计
- **响应式设计** - 支持桌面和移动设备
- **实时预览** - 图片、视频、音频文件即时预览
- **代码高亮** - 支持多种编程语言的语法高亮
- **动画效果** - 流畅的 Framer Motion 动画

### 🔧 技术特性
- **纯 Next.js 解决方案** - 无需额外的 WebSocket 服务器
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

## 📋 系统要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd coLAN
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 访问应用
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 创建用户名
1. 首次访问时，输入你的用户名
2. 用户名至少需要 2 个字符
3. 用户名不能重复

### 加入聊天室
1. 在主界面选择现有的聊天室
2. 如果房间有密码，输入正确的密码
3. 点击 "Join Room" 加入

### 创建聊天室
1. 点击 "Create Room" 按钮
2. 输入房间名称（可选：设置密码）
3. 点击 "Create Room" 创建

### 发送消息
1. 在聊天界面输入消息
2. 按回车键或点击发送按钮
3. 支持表情符号和长文本

### 文件分享
1. 点击聊天框旁的回形针图标
2. 选择要分享的文件（支持多选）
3. 点击上传按钮
4. 文件会自动在聊天中显示，支持预览

### 查看在线用户
1. 点击聊天室头部的用户计数
2. 查看所有在线用户的详细信息
3. 显示加入时间和在线状态

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