@echo off
echo 正在启动小红书风格小说网站...
echo.

REM 检查Node.js是否已安装
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 切换到项目目录
cd /d "%~dp0"

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖包安装失败
        pause
        exit /b 1
    )
)

REM 创建日志目录
if not exist "logs" mkdir logs

echo.
echo ================================
echo 小红书风格小说网站
echo ================================
echo 本地访问地址: http://localhost:3000
echo API接口地址: http://localhost:3000/api
echo 阅读页面: http://localhost:3000/read?id=1
echo.
echo 按 Ctrl+C 停止服务
echo ================================
echo.

REM 启动服务器
node server.js