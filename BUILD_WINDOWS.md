# coLAN Windows Build Instructions

## 构建Windows可执行文件

本项目提供了使用Nuitka构建Windows可执行文件的脚本，兼容Windows 7及以上系统。

### 🔧 构建要求

- Python 3.7+ (Windows 7兼容)
- pip (包管理器)
- 互联网连接 (下载依赖)

### 🚀 快速构建 (3种方法)

#### 方法1: 使用批处理脚本 (推荐)
```cmd
build_windows.bat
```

#### 方法2: 使用PowerShell脚本
```powershell
PowerShell -ExecutionPolicy Bypass -File build_windows.ps1
```

#### 方法3: 使用Python脚本
```bash
python build_windows.py
```

### 📦 脚本功能

所有构建脚本会自动执行：

1. **环境检查**: 验证Python和依赖
2. **自动安装**: 检查并安装Nuitka
3. **文件准备**: 复制必要的项目文件
4. **编译构建**: 使用Nuitka编译为exe
5. **打包发布**: 创建完整的发布包

### 📦 构建产物

构建完成后会生成 `coLAN_Windows_Release/` 目录，包含:

```
coLAN_Windows_Release/
├── coLAN.exe           # 主程序 (约30-50MB)
├── start_coLAN.bat     # 启动脚本
└── README.md           # 使用说明
```

### 🎯 使用方法

1. **复制整个文件夹**到目标Windows机器
2. **双击运行** `start_coLAN.bat` 或直接运行 `coLAN.exe`
3. **无需安装Python**，开箱即用

### ⚙️ 技术细节

**Nuitka构建参数**:
- `--standalone` - 独立可执行文件
- `--onefile` - 单文件模式
- `--windows-console-mode=force` - 强制控制台模式
- `--include-data-dir` - 包含模板和静态文件
- `--plugin-enable=anti-bloat` - 减小文件大小

**兼容性**:
- Windows 7, 8, 10, 11
- 32位和64位系统
- 无需预装Python运行时

### 🐛 故障排除

**构建失败**:
- 确保Python 3.7+版本
- 检查网络连接
- 尝试手动安装: `pip install nuitka`

**PowerShell执行策略错误**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**运行问题**:
- 检查Windows防火墙设置
- 确保端口5000未被占用
- 以管理员身份运行

### 📝 Windows构建脚本选择

| 脚本类型 | 文件名 | 适用场景 | 优势 |
|---------|--------|----------|------|
| 批处理 | `build_windows.bat` | 所有Windows版本 | 最兼容，无需权限 |
| PowerShell | `build_windows.ps1` | Windows 7+ | 更好的错误处理 |
| Python | `build_windows.py` | 跨平台 | 功能最完整 |

**推荐使用批处理脚本** (`build_windows.bat`)，因为它在所有Windows版本上都能正常工作。

### 📝 注意事项

- 首次构建需要下载编译器，可能较慢
- 生成的exe文件较大但完全独立
- 支持所有coLAN功能：聊天、文件共享、多用户