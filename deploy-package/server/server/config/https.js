const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * HTTPS服务器配置
 */
class HTTPSConfig {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        this.httpsOptions = null;
        this.httpServer = null;
        this.httpsServer = null;
    }

    /**
     * 加载SSL证书
     */
    loadSSLCertificates() {
        try {
            const sslPath = process.env.SSL_PATH || path.join(__dirname, '../../ssl');
            const keyPath = process.env.SSL_KEY_PATH || path.join(sslPath, 'private.key');
            const certPath = process.env.SSL_CERT_PATH || path.join(sslPath, 'certificate.crt');
            const caPath = process.env.SSL_CA_PATH || path.join(sslPath, 'ca_bundle.crt');

            // 检查证书文件是否存在
            if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
                console.warn('⚠️  SSL证书文件不存在，将生成自签名证书用于开发环境');
                return this.generateSelfSignedCert();
            }

            this.httpsOptions = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath)
            };

            // 如果存在CA证书链，添加它
            if (fs.existsSync(caPath)) {
                this.httpsOptions.ca = fs.readFileSync(caPath);
            }

            console.log('✅ SSL证书加载成功');
            return true;

        } catch (error) {
            console.error('❌ SSL证书加载失败:', error.message);
            if (process.env.NODE_ENV === 'production') {
                throw new Error('生产环境必须提供有效的SSL证书');
            }
            return this.generateSelfSignedCert();
        }
    }

    /**
     * 生成自签名证书（仅开发环境）
     */
    generateSelfSignedCert() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('生产环境不能使用自签名证书');
        }

        try {
            const selfsigned = require('selfsigned');
            const attrs = [
                { name: 'commonName', value: 'localhost' },
                { name: 'countryName', value: 'CN' },
                { name: 'stateOrProvinceName', value: 'Beijing' },
                { name: 'localityName', value: 'Beijing' },
                { name: 'organizationName', value: 'Development' },
                { name: 'organizationalUnitName', value: 'IT' }
            ];

            const pems = selfsigned.generate(attrs, {
                keySize: 2048,
                days: 365,
                algorithm: 'sha256',
                extensions: [
                    {
                        name: 'basicConstraints',
                        cA: true
                    },
                    {
                        name: 'keyUsage',
                        keyCertSign: true,
                        digitalSignature: true,
                        nonRepudiation: true,
                        keyEncipherment: true,
                        dataEncipherment: true
                    },
                    {
                        name: 'subjectAltName',
                        altNames: [
                            { type: 2, value: 'localhost' },
                            { type: 2, value: '127.0.0.1' },
                            { type: 7, ip: '127.0.0.1' }
                        ]
                    }
                ]
            });

            this.httpsOptions = {
                key: pems.private,
                cert: pems.cert
            };

            console.log('✅ 已生成自签名证书（仅用于开发环境）');
            return true;

        } catch (error) {
            console.error('❌ 生成自签名证书失败:', error.message);
            return false;
        }
    }

    /**
     * 启动HTTPS服务器
     */
    startServer() {
        const port = this.config.PORT || 3000;
        const httpsPort = process.env.HTTPS_PORT || 3443;

        // 启动HTTP服务器（生产环境用于重定向）
        this.httpServer = http.createServer(this.app);
        
        if (process.env.NODE_ENV === 'production') {
            // 生产环境：HTTP重定向到HTTPS
            this.httpServer = http.createServer((req, res) => {
                res.writeHead(301, {
                    Location: `https://${req.headers.host.replace(/:.*/, '')}:${httpsPort}${req.url}`
                });
                res.end();
            });
            
            this.httpServer.listen(port, () => {
                console.log(`🔄 HTTP重定向服务器启动在端口 ${port}，自动重定向到HTTPS`);
            });
        } else {
            // 开发环境：同时运行HTTP和HTTPS
            this.httpServer.listen(port, () => {
                console.log(`🌐 HTTP服务器启动在端口 ${port}`);
            });
        }

        // 启动HTTPS服务器
        if (this.httpsOptions) {
            this.httpsServer = https.createServer(this.httpsOptions, this.app);
            
            this.httpsServer.listen(httpsPort, () => {
                console.log(`
🔒 HTTPS服务器启动成功！
📍 HTTPS端口: ${httpsPort}
🌐 安全访问: https://localhost:${httpsPort}
📡 API接口: https://localhost:${httpsPort}/api
⏰ 启动时间: ${new Date().toLocaleString()}
${process.env.NODE_ENV !== 'production' ? '⚠️  开发环境使用自签名证书' : '✅ 生产环境使用正式SSL证书'}
                `);
            });

            // HTTPS服务器错误处理
            this.httpsServer.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(`❌ HTTPS端口 ${httpsPort} 已被占用`);
                } else {
                    console.error('❌ HTTPS服务器错误:', error);
                }
                process.exit(1);
            });
        }

        // HTTP服务器错误处理
        this.httpServer.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ HTTP端口 ${port} 已被占用`);
            } else {
                console.error('❌ HTTP服务器错误:', error);
            }
            process.exit(1);
        });

        // 优雅关闭
        this.setupGracefulShutdown();
    }

    /**
     * 设置优雅关闭
     */
    setupGracefulShutdown() {
        const shutdown = (signal) => {
            console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
            
            const closeServer = (server, name) => {
                return new Promise((resolve) => {
                    if (server) {
                        server.close((err) => {
                            if (err) {
                                console.error(`${name}服务器关闭时出错:`, err);
                            } else {
                                console.log(`✅ ${name}服务器已关闭`);
                            }
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            };

            Promise.all([
                closeServer(this.httpServer, 'HTTP'),
                closeServer(this.httpsServer, 'HTTPS')
            ]).then(() => {
                console.log('✅ 所有服务器已优雅关闭');
                process.exit(0);
            });

            // 强制关闭超时
            setTimeout(() => {
                console.error('⏰ 优雅关闭超时，强制退出');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    /**
     * 获取SSL证书信息
     */
    getCertificateInfo() {
        if (!this.httpsOptions || !this.httpsOptions.cert) {
            return null;
        }

        try {
            const crypto = require('crypto');
            const cert = crypto.X509Certificate 
                ? new crypto.X509Certificate(this.httpsOptions.cert)
                : null;

            if (!cert) return null;

            return {
                subject: cert.subject,
                issuer: cert.issuer,
                validFrom: cert.validFrom,
                validTo: cert.validTo,
                fingerprint: cert.fingerprint,
                serialNumber: cert.serialNumber
            };
        } catch (error) {
            console.warn('获取证书信息失败:', error.message);
            return null;
        }
    }
}

/**
 * SSL证书安装指南
 */
function showSSLInstallGuide() {
    console.log(`
📋 SSL证书安装指南：

1. 创建SSL目录：
   mkdir ssl

2. 将证书文件放入ssl目录：
   - private.key      (私钥文件)
   - certificate.crt  (证书文件)
   - ca_bundle.crt    (证书链文件，可选)

3. 设置环境变量：
   SSL_PATH=/path/to/ssl
   SSL_KEY_PATH=/path/to/private.key
   SSL_CERT_PATH=/path/to/certificate.crt
   SSL_CA_PATH=/path/to/ca_bundle.crt
   HTTPS_PORT=443

4. 生产环境部署建议：
   - 使用Let's Encrypt免费证书
   - 配置Nginx反向代理处理SSL
   - 定期更新证书

📝 Let's Encrypt自动化脚本：
   npm install -g certbot
   certbot --nginx -d yourdomain.com
    `);
}

module.exports = {
    HTTPSConfig,
    showSSLInstallGuide
};