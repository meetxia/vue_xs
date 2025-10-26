@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     MOMO炒饭店小说网站 - Vue 3 重构版                  ║
echo ║     快速启动脚本                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 项目根目录: H:\momo-ruanjiansheji\axs_html\deploy-package\vue_xs
echo.

:MENU
echo ════════════════════════════════════════
echo 请选择操作：
echo ════════════════════════════════════════
echo.
echo [1] 初始化前端项目 (工程师B)
echo [2] 初始化后端项目 (工程师C)
echo [3] 启动前端开发服务器
echo [4] 启动后端开发服务器
echo [5] 同时启动前后端 (推荐)
echo [6] 打开数据库管理 (Prisma Studio)
echo [7] 打开phpMyAdmin
echo [0] 退出
echo.
set /p choice=请输入选项 (0-7): 

if "%choice%"=="1" goto INIT_FRONTEND
if "%choice%"=="2" goto INIT_BACKEND
if "%choice%"=="3" goto START_FRONTEND
if "%choice%"=="4" goto START_BACKEND
if "%choice%"=="5" goto START_ALL
if "%choice%"=="6" goto OPEN_PRISMA
if "%choice%"=="7" goto OPEN_PHPMYADMIN
if "%choice%"=="0" goto END

echo 无效选项，请重新选择
timeout /t 2 >nul
goto MENU

:INIT_FRONTEND
echo.
echo ════════════════════════════════════════
echo 正在初始化前端项目...
echo ════════════════════════════════════════
cd frontend
echo.
echo 创建Vue 3项目...
call npm create vite@latest . -- --template vue-ts
echo.
echo 安装依赖...
call npm install
call npm install element-plus vue-router pinia axios
call npm install -D tailwindcss postcss autoprefixer
echo.
echo ✅ 前端项目初始化完成！
echo.
pause
goto MENU

:INIT_BACKEND
echo.
echo ════════════════════════════════════════
echo 正在初始化后端项目...
echo ════════════════════════════════════════
cd backend
echo.
echo 初始化package.json...
call npm init -y
echo.
echo 安装依赖...
call npm install fastify @fastify/cors @fastify/jwt @fastify/multipart
call npm install @prisma/client bcrypt jsonwebtoken dotenv
call npm install -D typescript @types/node ts-node nodemon prisma
call npm install -D @types/bcrypt @types/jsonwebtoken
echo.
echo 初始化TypeScript...
call npx tsc --init
echo.
echo 初始化Prisma...
call npx prisma init
echo.
echo ✅ 后端项目初始化完成！
echo.
echo ⚠️  下一步：
echo    1. 编辑 backend\.env 配置数据库连接
echo    2. 编辑 backend\prisma\schema.prisma 设计数据库表
echo    3. 运行 npx prisma db push 创建数据库表
echo.
pause
goto MENU

:START_FRONTEND
echo.
echo ════════════════════════════════════════
echo 启动前端开发服务器...
echo ════════════════════════════════════════
cd frontend
echo.
echo 🚀 前端服务器启动中...
echo 📍 地址: http://localhost:5188
echo.
call npm run dev
pause
goto MENU

:START_BACKEND
echo.
echo ════════════════════════════════════════
echo 启动后端开发服务器...
echo ════════════════════════════════════════
cd backend
echo.
echo 🚀 后端服务器启动中...
echo 📍 地址: http://localhost:3000
echo 📡 API: http://localhost:3000/api/health
echo.
call npm run dev
pause
goto MENU

:START_ALL
echo.
echo ════════════════════════════════════════
echo 同时启动前后端服务器...
echo ════════════════════════════════════════
echo.
echo 正在启动后端...
start "后端服务器" cmd /k "cd backend && npm run dev"
timeout /t 3 >nul
echo.
echo 正在启动前端...
start "前端服务器" cmd /k "cd frontend && npm run dev"
echo.
echo ✅ 前后端服务器已启动！
echo.
echo 📍 前端: http://localhost:5188
echo 📍 后端: http://localhost:3000
echo.
pause
goto MENU

:OPEN_PRISMA
echo.
echo ════════════════════════════════════════
echo 打开Prisma Studio...
echo ════════════════════════════════════════
cd backend
start "Prisma Studio" cmd /k "npx prisma studio"
echo.
echo ✅ Prisma Studio已启动！
echo 📍 地址: http://localhost:5555
echo.
timeout /t 3 >nul
goto MENU

:OPEN_PHPMYADMIN
echo.
echo 打开phpMyAdmin...
start http://127.0.0.1/phpmyadmin/
echo.
echo ✅ phpMyAdmin已在浏览器中打开！
echo.
timeout /t 2 >nul
goto MENU

:END
echo.
echo 再见！👋
echo.
exit

