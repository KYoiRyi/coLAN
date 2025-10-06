#!/bin/bash

# coLAN 一键部署脚本 (Linux/macOS)
# 现代化局域网聊天应用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
RESET='\033[0m'

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
        if command -v apt-get &> /dev/null; then
            DISTRO="Ubuntu/Debian"
        elif command -v yum &> /dev/null; then
            DISTRO="CentOS/RHEL/Fedora"
        elif command -v pacman &> /dev/null; then
            DISTRO="Arch Linux"
        else
            DISTRO="Unknown Linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        DISTRO="macOS"
    else
        OS="Unknown"
        DISTRO="Unknown"
    fi
}

# 显示 Banner
echo
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║                coLAN 一键部署脚本 ($OS)                 ║${RESET}"
echo -e "${CYAN}║                现代化局域网聊天应用                       ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo

# 检测操作系统信息
detect_os
echo -e "${CYAN}系统信息${RESET}"
echo "----------------------------------------"
echo -e "操作系统: $OS"
if [[ -n "$DISTRO" && "$DISTRO" != "Unknown" ]]; then
    echo -e "发行版本: $DISTRO"
fi
echo -e "当前目录: $(pwd)"
echo -e "当前时间: $(date)"
echo -e "当前用户: $(whoami)"
echo

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo -e "${YELLOW}[⚠️]  检测到 root 用户${RESET}"
        echo -e "建议使用普通用户运行此脚本"
        echo -e "如需继续，请按 Enter，否则按 Ctrl+C 退出"
        read -r
    fi
}

# 检查命令是否存在
check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# 检查 Node.js
check_nodejs() {
    echo -e "${YELLOW}[1/3]${RESET} 检查 Node.js 环境..."

    if check_command node; then
        NODE_VERSION=$(node --version)
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✓ 找到 Node.js: $NODE_VERSION${RESET}"
        echo -e "${GREEN}✓ npm 版本: $NPM_VERSION${RESET}"

        # 检查 Node.js 版本
        NODE_MAJOR=$(echo $NODE_VERSION | grep -oE 'v([0-9]+)' | cut -c2-)
        if [[ $NODE_MAJOR -lt 18 ]]; then
            echo -e "${YELLOW}⚠ 建议使用 Node.js 18 或更高版本${RESET}"
            echo "当前版本可能无法正常工作"
        fi
    else
        echo -e "${RED}✗ 错误: 未找到 Node.js${RESET}"
        echo "请先安装 Node.js 18 或更高版本"

        if [[ "$OS" == "Linux" ]]; then
            echo
            echo -e "${CYAN}安装建议:${RESET}"
            case $DISTRO in
                "Ubuntu/Debian")
                    echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
                    echo "sudo apt-get install -y nodejs"
                    ;;
                "CentOS/RHEL/Fedora")
                    echo "curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -"
                    echo "sudo yum install -y nodejs npm"
                    ;;
                "Arch Linux")
                    echo "sudo pacman -S nodejs npm"
                    ;;
            esac
        elif [[ "$OS" == "macOS" ]]; then
            echo "建议使用以下方式之一:"
            echo "1. Homebrew: brew install node"
            echo "2. 官方安装包: https://nodejs.org/"
        fi

        exit 1
    fi
}

# 检查项目配置
check_project() {
    echo -e "${YELLOW}[2/3]${RESET} 检查项目配置..."

    if [[ ! -f "package.json" ]]; then
        echo -e "${RED}✗ 错误: 未找到 package.json 文件${RESET}"
        echo "请确保在正确的项目目录中运行此脚本"
        exit 1
    else
        echo -e "${GREEN}✓ package.json 文件存在${RESET}"
    fi
}

# 安装依赖
install_dependencies() {
    echo -e "${YELLOW}[3/3]${RESET} 安装项目依赖..."

    echo -e "${MAGENTA}=== 安装项目依赖 ===${RESET}"
    echo -e "${CYAN}正在安装 Node.js 包...${RESET}"

    if npm install; then
        echo -e "${GREEN}✓ 依赖安装完成${RESET}"
    else
        echo -e "${RED}✗ 依赖安装失败${RESET}"
        echo "请检查网络连接或尝试清理缓存: npm cache clean --force"
        exit 1
    fi
}

# 构建项目
build_project() {
    echo
    echo -e "${MAGENTA}=== 构建前端项目 ===${RESET}"
    echo -e "${CYAN}正在构建 Next.js 应用...${RESET}"

    if npm run build; then
        echo -e "${GREEN}✓ 前端构建完成${RESET}"
        BUILD_MODE="prod"
    else
        echo -e "${YELLOW}⚠ 构建失败，将使用开发模式${RESET}"
        BUILD_MODE="dev"
    fi
}

# 启动服务
start_services() {
    echo
    echo -e "${MAGENTA}=== 启动 coLAN 服务 ===${RESET}"
    echo

    # 创建日志目录
    mkdir -p logs

    # 启动应用服务（后台运行）
    echo -e "${CYAN}正在启动 coLAN 应用...${RESET}"

    if [[ "$BUILD_MODE" == "prod" ]]; then
        nohup npm start > logs/app.log 2>&1 &
    else
        nohup npm run dev > logs/app.log 2>&1 &
    fi

    APP_PID=$!
    echo "应用服务 PID: $APP_PID"
    echo $APP_PID > .app.pid

    # 等待应用启动
    echo -e "${YELLOW}等待应用启动...${RESET}"
    sleep 8

    # 显示完成信息
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${GREEN}║                     🎉 部署完成!                           ║${RESET}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${RESET}"
    echo
    echo -e "${GREEN}应用地址:${RESET} http://localhost:3000"
    echo
    echo -e "${CYAN}功能特色:${RESET}"
    echo "• 现代化毛玻璃效果界面"
    echo "• 实时聊天和文件分享"
    echo "• 键盘快捷键支持 (按 ? 查看帮助)"
    echo "• 深色/浅色主题切换"
    echo "• 临时和永久用户账户"
    echo
    echo -e "${YELLOW}使用说明:${RESET}"
    echo "1. 打开浏览器访问 http://localhost:3000"
    echo "2. 创建用户名或登录"
    echo "3. 创建或加入聊天室"
    echo "4. 开始聊天!"
    echo
    echo -e "${CYAN}服务管理:${RESET}"
    echo "• 查看日志: tail -f logs/app.log"
    echo "• 停止服务: ./stop-colan.sh"
    echo "• 重启服务: ./stop-colan.sh && ./deploy-linux.sh"
    echo
    echo -e "${BLUE}问题排查:${RESET}"
    echo "• 查看日志文件排查启动问题"
    echo "• 检查端口 3000 是否被占用"
    echo "• 确保防火墙允许相应端口"
    echo "• 如果依赖安装失败，尝试手动安装"
    echo

    # 询问是否打开浏览器
    echo -n -e "${CYAN}是否自动打开浏览器? (y/n): ${RESET}"
    read -r OPEN_BROWSER
    if [[ "$OPEN_BROWSER" =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}正在打开浏览器...${RESET}"

        # 检测可用的浏览器
        if check_command xdg-open; then
            xdg-open http://localhost:3000
        elif check_command open; then
            open http://localhost:3000
        elif check_command firefox; then
            firefox http://localhost:3000 &
        elif check_command google-chrome; then
            google-chrome http://localhost:3000 &
        elif check_command chromium; then
            chromium http://localhost:3000 &
        else
            echo -e "${YELLOW}未找到合适的浏览器，请手动打开 http://localhost:3000${RESET}"
        fi
    fi

    echo
    echo -e "${GREEN}✓ coLAN 部署脚本执行完成!${RESET}"
    echo -e "${GREEN}感谢使用 coLAN - 让局域网聊天更简单 🚀${RESET}"
    echo
    echo -e "${BLUE}服务运行状态:${RESET}"
    echo -e "应用 PID: $APP_PID"
    echo
    echo -e "${YELLOW}提示: 服务在后台运行，使用 './stop-colan.sh' 停止服务${RESET}"
}

# 创建停止脚本
create_stop_script() {
    cat > stop-colan.sh << 'EOF'
#!/bin/bash

echo "停止 coLAN 服务..."

# 查找并停止 Node.js 进程
pkill -f "npm.*dev" 2>/dev/null || pkill -f "npm.*start" 2>/dev/null || echo "未找到运行的 coLAN 服务"

echo "coLAN 服务已停止"
EOF
    chmod +x stop-colan.sh
    echo -e "${GREEN}✓ stop-colan.sh 停止脚本已创建${RESET}"
}

# 主函数
main() {
    # 检查 root 权限
    check_root

    # 运行检查和安装步骤
    check_nodejs
    check_project
    install_dependencies
    build_project
    create_stop_script
    start_services
}

# 错误处理
trap 'echo -e "\n${RED}部署过程中出现错误，请检查上述输出信息${RESET}"; exit 1' ERR

# 执行主函数
main "$@"