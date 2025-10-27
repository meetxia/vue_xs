// 快速测试数据库连接
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 测试数据库连接...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');
    
    // 测试查询
    const userCount = await prisma.user.count();
    console.log(`📊 用户数量: ${userCount}`);
    
    const novelCount = await prisma.novel.count();
    console.log(`📚 小说数量: ${novelCount}`);
    
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

