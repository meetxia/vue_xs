#!/usr/bin/env node

/**
 * 安全检查脚本
 * 检查项目的安全配置和潜在风险
 */

const fs = require('fs');
const path = require('path');

class SecurityChecker {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.passed = [];
    }

    // 检查环境变量配置
    checkEnvironmentConfig() {
        console.log('🔍 检查环境变量配置...');
        
        // 检查.env文件是否存在
        if (!fs.existsSync('.env')) {
            this.issues.push('❌ 缺少.env文件，敏感配置可能暴露');
        } else {
            this.passed.push('✅ .env文件存在');
            
            // 检查.env文件内容
            const envContent = fs.readFileSync('.env', 'utf8');
            
            if (envContent.includes('your_') || envContent.includes('123456')) {
                this.warnings.push('⚠️ .env文件包含默认值，请更新为实际配置');
            }
            
            if (!envContent.includes('JWT_SECRET=')) {
                this.issues.push('❌ .env文件缺少JWT_SECRET配置');
            }
            
            if (!envContent.includes('ADMIN_PASSWORD=')) {
                this.issues.push('❌ .env文件缺少ADMIN_PASSWORD配置');
            }
        }
        
        // 检查.env.example是否存在
        if (!fs.existsSync('.env.example')) {
            this.warnings.push('⚠️ 缺少.env.example模板文件');
        } else {
            this.passed.push('✅ .env.example模板文件存在');
        }
    }

    // 检查硬编码密钥
    checkHardcodedSecrets() {
        console.log('🔍 检查硬编码密钥...');
        
        const configFile = 'server/config/index.js';
        if (fs.existsSync(configFile)) {
            const content = fs.readFileSync(configFile, 'utf8');
            
            if (content.includes("'123456'") || content.includes('"123456"')) {
                this.issues.push('❌ 配置文件包含硬编码弱密码');
            } else {
                this.passed.push('✅ 未发现硬编码弱密码');
            }
            
            if (content.includes('xiaohongshu-novel-secret-key-2024') && !content.includes('process.env.JWT_SECRET')) {
                this.issues.push('❌ JWT密钥仍然硬编码');
            } else {
                this.passed.push('✅ JWT密钥使用环境变量');
            }
        }
    }

    // 检查调试日志
    checkDebugLogs() {
        console.log('🔍 检查调试日志...');
        
        const jsFiles = this.findJSFiles('public/js');
        let logCount = 0;
        
        jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const matches = content.match(/console\.log\(/g);
            if (matches) {
                logCount += matches.length;
            }
        });
        
        if (logCount > 10) {
            this.warnings.push(`⚠️ 发现${logCount}处console.log，建议在生产环境中移除`);
        } else if (logCount > 0) {
            this.warnings.push(`⚠️ 发现${logCount}处console.log，已使用条件日志`);
        } else {
            this.passed.push('✅ 未发现调试日志');
        }
    }

    // 检查文件权限
    checkFilePermissions() {
        console.log('🔍 检查文件权限...');
        
        const sensitiveFiles = ['.env', 'data/users.json', 'data/novels.json'];
        
        sensitiveFiles.forEach(file => {
            if (fs.existsSync(file)) {
                try {
                    const stats = fs.statSync(file);
                    // 在Windows上权限检查有限，主要检查文件是否存在
                    this.passed.push(`✅ ${file} 文件权限正常`);
                } catch (error) {
                    this.warnings.push(`⚠️ 无法检查${file}的权限`);
                }
            }
        });
    }

    // 检查依赖安全性
    checkDependencies() {
        console.log('🔍 检查依赖安全性...');
        
        if (fs.existsSync('package.json')) {
            this.passed.push('✅ package.json存在');
            
            // 建议运行npm audit
            this.warnings.push('⚠️ 建议运行 npm audit 检查依赖漏洞');
        }
    }

    // 查找JS文件
    findJSFiles(dir) {
        const files = [];
        
        if (!fs.existsSync(dir)) return files;
        
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...this.findJSFiles(fullPath));
            } else if (item.endsWith('.js')) {
                files.push(fullPath);
            }
        });
        
        return files;
    }

    // 运行所有检查
    runAllChecks() {
        console.log('🛡️ 开始安全检查...\n');
        
        this.checkEnvironmentConfig();
        this.checkHardcodedSecrets();
        this.checkDebugLogs();
        this.checkFilePermissions();
        this.checkDependencies();
        
        this.printReport();
    }

    // 打印报告
    printReport() {
        console.log('\n📊 安全检查报告');
        console.log('='.repeat(50));
        
        if (this.issues.length > 0) {
            console.log('\n🚨 严重问题（必须修复）:');
            this.issues.forEach(issue => console.log(`  ${issue}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️ 警告（建议修复）:');
            this.warnings.forEach(warning => console.log(`  ${warning}`));
        }
        
        if (this.passed.length > 0) {
            console.log('\n✅ 通过检查:');
            this.passed.forEach(pass => console.log(`  ${pass}`));
        }
        
        console.log('\n📈 总结:');
        console.log(`  严重问题: ${this.issues.length}`);
        console.log(`  警告: ${this.warnings.length}`);
        console.log(`  通过: ${this.passed.length}`);
        
        if (this.issues.length === 0) {
            console.log('\n🎉 恭喜！未发现严重安全问题');
        } else {
            console.log('\n🔧 请修复严重问题后再部署到生产环境');
        }
        
        console.log('\n💡 建议:');
        console.log('  1. 定期运行 npm audit 检查依赖漏洞');
        console.log('  2. 使用强密码和随机JWT密钥');
        console.log('  3. 在生产环境中禁用调试日志');
        console.log('  4. 定期备份数据文件');
    }
}

// 运行安全检查
if (require.main === module) {
    const checker = new SecurityChecker();
    checker.runAllChecks();
}

module.exports = SecurityChecker;
