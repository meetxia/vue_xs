@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║            环境检查工具                                 ║
echo ║     检查开发环境是否就绪                                ║
echo ╚════════════════════════════════════════════════════════╝
echo.

set ERROR_COUNT=0

echo ════════════════════════════════════════
echo 正在检查开发环境...
echo ════════════════════════════════════════
echo.

REM 检查Node.js
echo [1/7] 检查 Node.js...
node -v >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo    ✅ Node.js 已安装: !NODE_VERSION!
) else (
    echo    ❌ Node.js 未安装
    echo       请访问: https://nodejs.org/zh-cn/
    set /a ERROR_COUNT+=1
)

REM 检查npm
echo [2/7] 检查 npm...
npm -v >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo    ✅ npm 已安装: !NPM_VERSION!
) else (
    echo    ❌ npm 未安装
    set /a ERROR_COUNT+=1
)

REM 检查Git
echo [3/7] 检查 Git...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo    ✅ Git 已安装: !GIT_VERSION!
) else (
    echo    ❌ Git 未安装
    echo       请访问: https://git-scm.com/download/win
    set /a ERROR_COUNT+=1
)

REM 检查VS Code
echo [4/7] 检查 VS Code...
code --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ VS Code 已安装
) else (
    echo    ⚠️  VS Code 未安装（推荐安装）
    echo       请访问: https://code.visualstudio.com/
)

REM 检查MySQL
echo [5/7] 检查 MySQL (XAMPP)...
netstat -ano | findstr ":3306" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ MySQL 正在运行 (端口 3306)
) else (
    echo    ❌ MySQL 未运行
    echo       请启动 XAMPP 的 MySQL 服务
    set /a ERROR_COUNT+=1
)

REM 检查Apache
echo [6/7] 检查 Apache (XAMPP)...
netstat -ano | findstr ":80" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Apache 正在运行 (端口 80)
) else (
    echo    ⚠️  Apache 未运行（phpMyAdmin需要）
    echo       建议启动 XAMPP 的 Apache 服务
)

REM 检查项目目录
echo [7/7] 检查项目目录...
if exist "frontend" (
    echo    ✅ frontend\ 目录存在
) else (
    echo    ⚠️  frontend\ 目录不存在（需要初始化）
)

if exist "backend" (
    echo    ✅ backend\ 目录存在
) else (
    echo    ⚠️  backend\ 目录不存在（需要初始化）
)

echo.
echo ════════════════════════════════════════

if %ERROR_COUNT% equ 0 (
    echo.
    echo ✅ 所有检查通过！环境已就绪！
    echo.
    echo 🚀 下一步：
    echo    1. 双击 快速启动.bat
    echo    2. 选择 [1] 初始化前端项目
    echo    3. 选择 [2] 初始化后端项目
    echo    4. 开始开发！
    echo.
) else (
    echo.
    echo ❌ 发现 %ERROR_COUNT% 个问题，请先解决！
    echo.
    echo 📝 解决方法：
    echo    1. 安装缺失的软件
    echo    2. 启动必要的服务（MySQL）
    echo    3. 再次运行本检查脚本
    echo.
)

echo ════════════════════════════════════════
echo.
pause

