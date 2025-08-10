@echo off
echo 正在启动小红书风格小说网站（生产环境）...

REM 设置生产环境变量
set NODE_ENV=production

REM 检查.env文件是否存在
if not exist .env (
    echo 错误：未找到.env文件，请先配置环境变量
    echo 请复制.env.example为.env并填入正确的配置
    pause
    exit /b 1
)

REM 检查node_modules是否存在
if not exist node_modules (
    echo 正在安装依赖...
    npm install
)

REM 启动服务器
echo 启动生产环境服务器...
npm start

pause
