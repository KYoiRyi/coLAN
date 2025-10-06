@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                coLAN 一键部署脚本 (Windows)              ║
echo ║                现代化局域网聊天应用                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [⚠️]  建议以管理员身份运行此脚本以确保完整的权限
    echo.
)

:: 设置颜色代码
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "MAGENTA=[95m"
set "CYAN=[96m"
set "WHITE=[97m"
set "RESET=[0m"

:: 显示系统信息
echo %CYAN%系统信息%RESET%
echo ----------------------------------------
echo 操作系统: %OS%
echo 当前目录: %CD%
echo 当前时间: %DATE% %TIME%
echo.

:: 检查 Node.js
echo %YELLOW%[1/3]%RESET% 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%✗ 错误: 未找到 Node.js%RESET%
    echo 请先安装 Node.js 18 或更高版本
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo %GREEN%✓ 找到 Node.js %NODE_VERSION%%RESET%
)

:: 检查 npm
echo %YELLOW%[2/3]%RESET% 检查 npm 包管理器...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%✗ 错误: 未找到 npm%RESET%
    echo 请确保 npm 已正确安装
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo %GREEN%✓ npm 版本 %NPM_VERSION%%RESET%
)

:: 检查 package.json
echo %YELLOW%[3/3]%RESET% 检查项目配置...
if not exist package.json (
    echo %RED%✗ 错误: 未找到 package.json 文件%RESET%
    echo 请确保在正确的项目目录中运行此脚本
    pause
    exit /b 1
) else (
    echo %GREEN%✓ package.json 文件存在%RESET%
)

:: 安装前端依赖
echo.
echo %MAGENTA%=== 安装项目依赖 ===%RESET%
echo %CYAN%正在安装 Node.js 依赖包...%RESET%
npm install
if %errorlevel% neq 0 (
    echo %RED%✗ 依赖安装失败%RESET%
    echo 请检查网络连接或尝试手动安装: npm install
    pause
    exit /b 1
) else (
    echo %GREEN%✓ 依赖安装完成%RESET%
)

:: 构建前端
echo.
echo %MAGENTA%=== 构建项目 ===%RESET%
echo %CYAN%正在构建 Next.js 应用...%RESET%
npm run build
if %errorlevel% neq 0 (
    echo %YELLOW%⚠ 构建失败，将使用开发模式%RESET%
    set BUILD_MODE=dev
) else (
    echo %GREEN%✓ 前端构建完成%RESET%
    set BUILD_MODE=prod
)

:: 启动服务
echo.
echo %MAGENTA%=== 启动 coLAN 服务 ===%RESET%
echo.

:: 创建启动脚本
(
echo @echo off
echo title coLAN 服务
echo echo 启动 Next.js 应用...
echo.
if "%BUILD_MODE%"=="prod" (
    echo npm start
) else (
    echo npm run dev
)
echo pause
) > start-colan.bat

echo %CYAN%正在启动 coLAN 应用...%RESET%
start "coLAN Application" cmd /c start-colan.bat

:: 等待应用启动
echo %YELLOW%等待应用启动...%RESET%
timeout /t 5 /nobreak >nul

:: 显示完成信息
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                     🎉 部署完成!                           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo %GREEN%应用地址:%RESET% http://localhost:3000
echo.
echo %CYAN%功能特色:%RESET%
echo • 现代化毛玻璃效果界面
echo • 实时聊天和文件分享
echo • 键盘快捷键支持 (按 ? 查看帮助)
echo • 深色/浅色主题切换
echo • 临时和永久用户账户
echo.
echo %YELLOW%使用说明:%RESET%
echo 1. 打开浏览器访问 http://localhost:3000
echo 2. 创建用户名或登录
echo 3. 创建或加入聊天室
echo 4. 开始聊天!
echo.
echo %RED%停止服务:%RESET% 关闭 coLAN 应用窗口或按 Ctrl+C
echo.
echo %BLUE%问题排查:%RESET%
echo • 如果端口 3000 被占用，请关闭其他占用的应用
echo • 如果依赖安装失败，请检查网络连接或尝试手动安装
echo • 如果遇到权限问题，请以管理员身份运行脚本
echo.

:: 询问是否打开浏览器
set /p "OPEN_BROWSER=%CYAN%是否自动打开浏览器? (y/n): %RESET%"
if /i "%OPEN_BROWSER%"=="y" (
    echo %CYAN%正在打开浏览器...%RESET%
    start http://localhost:3000
)

echo.
echo %GREEN%✓ coLAN 部署脚本执行完成!%RESET%
echo 感谢使用 coLAN - 让局域网聊天更简单 🚀
echo.
pause