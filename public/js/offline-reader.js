// 离线阅读功能实现
class OfflineReaderManager {
    constructor() {
        this.dbName = 'novel_offline_db';
        this.dbVersion = 1;
        this.db = null;
        this.maxStorageSize = 50 * 1024 * 1024; // 默认50MB存储限制
        this.storageLimit = parseInt(localStorage.getItem('offline_storage_limit')) || this.maxStorageSize;
        this.downloadQueue = [];
        this.isProcessingQueue = false;
        this.initRetries = 0;
        this.maxInitRetries = 3;
        this.isSupported = true;

        // 检查浏览器支持
        if (!this.checkBrowserSupport()) {
            this.isSupported = false;
            console.warn('离线阅读功能不受支持');
            return;
        }

        // 不在构造函数中立即初始化数据库，而是延迟到需要时
        try {
            this.initNetworkListeners();
        } catch (error) {
            console.error('初始化网络监听器失败:', error);
        }
    }

    // 检查浏览器支持
    checkBrowserSupport() {
        if (!window.indexedDB) {
            console.warn('浏览器不支持IndexedDB');
            return false;
        }
        if (!window.localStorage) {
            console.warn('浏览器不支持LocalStorage');
            return false;
        }
        return true;
    }

    // 初始化IndexedDB数据库
    async initDatabase() {
        // 如果不支持离线功能，直接返回
        if (!this.isSupported) {
            throw new Error('浏览器不支持离线阅读功能');
        }

        // 如果数据库已经初始化，直接返回
        if (this.db) {
            return this.db;
        }

        // 检查浏览器是否支持IndexedDB
        if (!window.indexedDB) {
            const error = new Error('浏览器不支持IndexedDB，无法使用离线阅读功能');
            console.error(error.message);
            throw error;
        }

        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onupgradeneeded = (event) => {
                    try {
                        const db = event.target.result;
                        console.log('正在升级数据库结构...');

                        // 创建小说内容存储
                        if (!db.objectStoreNames.contains('novels')) {
                            const novelStore = db.createObjectStore('novels', { keyPath: 'id' });
                            novelStore.createIndex('timestamp', 'timestamp', { unique: false });
                            console.log('创建novels存储成功');
                        }

                        // 创建小说章节存储
                        if (!db.objectStoreNames.contains('chapters')) {
                            const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
                            chapterStore.createIndex('novelId', 'novelId', { unique: false });
                            chapterStore.createIndex('timestamp', 'timestamp', { unique: false });
                            console.log('创建chapters存储成功');
                        }

                        // 创建下载任务存储
                        if (!db.objectStoreNames.contains('downloadTasks')) {
                            const taskStore = db.createObjectStore('downloadTasks', { keyPath: 'id', autoIncrement: true });
                            taskStore.createIndex('status', 'status', { unique: false });
                            taskStore.createIndex('timestamp', 'timestamp', { unique: false });
                            console.log('创建downloadTasks存储成功');
                        }
                    } catch (upgradeError) {
                        console.error('数据库升级过程中出错:', upgradeError);
                        reject(new Error(`数据库升级失败: ${upgradeError.message}`));
                    }
                };

                request.onsuccess = (event) => {
                    try {
                        this.db = event.target.result;
                        console.log('离线阅读数据库初始化成功');

                        // 添加数据库错误处理
                        this.db.onerror = (errorEvent) => {
                            console.error('数据库操作错误:', errorEvent.target.error);
                        };

                        resolve(this.db);
                    } catch (successError) {
                        console.error('数据库初始化成功处理中出错:', successError);
                        reject(successError);
                    }
                };

                request.onerror = (event) => {
                    const error = event.target.error;
                    console.error('离线阅读数据库初始化失败:', error);

                    // 提供更详细的错误信息
                    let errorMessage = '数据库初始化失败';
                    if (error) {
                        if (error.name === 'QuotaExceededError') {
                            errorMessage = '存储空间不足，请清理浏览器数据后重试';
                        } else if (error.name === 'InvalidStateError') {
                            errorMessage = '数据库状态异常，请刷新页面重试';
                        } else if (error.name === 'UnknownError') {
                            errorMessage = '数据库访问被阻止，请检查浏览器设置';
                        } else {
                            errorMessage = `数据库错误: ${error.message || error.name}`;
                        }
                    }

                    reject(new Error(errorMessage));
                };

                request.onblocked = (event) => {
                    console.warn('数据库升级被阻止，可能有其他标签页正在使用');
                    reject(new Error('数据库升级被阻止，请关闭其他标签页后重试'));
                };

            } catch (initError) {
                console.error('数据库初始化过程中出错:', initError);
                reject(new Error(`初始化失败: ${initError.message}`));
            }
        });
    }

    // 重试初始化数据库
    async retryInitDatabase() {
        if (this.initRetries >= this.maxInitRetries) {
            throw new Error(`数据库初始化失败，已重试${this.maxInitRetries}次`);
        }

        this.initRetries++;
        console.log(`正在重试初始化数据库，第${this.initRetries}次尝试`);

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * this.initRetries));

        try {
            return await this.initDatabase();
        } catch (error) {
            console.error(`第${this.initRetries}次重试失败:`, error);
            if (this.initRetries < this.maxInitRetries) {
                return await this.retryInitDatabase();
            } else {
                throw error;
            }
        }
    }

    // 初始化网络状态监听
    initNetworkListeners() {
        try {
            window.addEventListener('online', () => {
                console.log('网络已连接，可以同步数据');
                this.processDownloadQueue();
                
                // 显示网络已连接通知
                if (typeof showToast === 'function') {
                    showToast('网络已连接，正在同步数据', 'success');
                } else if (window.Utils && typeof window.Utils.showToast === 'function') {
                    window.Utils.showToast('网络已连接，正在同步数据', 'success');
                }
            });
            
            window.addEventListener('offline', () => {
                console.log('网络已断开，切换到离线模式');
                
                // 显示网络已断开通知
                if (typeof showToast === 'function') {
                    showToast('网络已断开，已切换到离线模式', 'info');
                } else if (window.Utils && typeof window.Utils.showToast === 'function') {
                    window.Utils.showToast('网络已断开，已切换到离线模式', 'info');
                }
            });
        } catch (error) {
            console.error('初始化网络监听器时出错:', error);
        }
    }
    
    // 检查是否在线
    isOnline() {
        return navigator.onLine;
    }
    
    // 保存小说到离线存储
    async saveNovel(novel) {
        if (!this.db) {
            try {
                await this.initDatabase();
            } catch (error) {
                console.error('数据库初始化失败，尝试重试:', error);
                await this.retryInitDatabase();
            }
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['novels'], 'readwrite');
            const store = transaction.objectStore('novels');
            
            // 添加时间戳用于过期处理
            novel.timestamp = Date.now();
            novel.size = this.estimateSize(novel);
            
            const request = store.put(novel);
            
            request.onsuccess = () => {
                resolve(novel);
            };
            
            request.onerror = (event) => {
                console.error('保存小说失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    // 获取离线小说
    async getNovel(novelId) {
        if (!this.isSupported) {
            return null;
        }
        
        if (!this.db) {
            try {
                await this.initDatabase();
            } catch (error) {
                console.error('数据库初始化失败，尝试重试:', error);
                try {
                    await this.retryInitDatabase();
                } catch (retryError) {
                    console.error('重试初始化失败:', retryError);
                    return null;
                }
            }
        }
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['novels'], 'readonly');
                const store = transaction.objectStore('novels');
                const request = store.get(parseInt(novelId));
                
                request.onsuccess = (event) => {
                    const novel = event.target.result;
                    if (novel) {
                        // 更新最后访问时间
                        this.updateNovelTimestamp(parseInt(novelId));
                    }
                    resolve(novel);
                };
                
                request.onerror = (event) => {
                    console.error('获取小说失败:', event.target.error);
                    resolve(null); // 不要reject，返回null即可
                };
            } catch (error) {
                console.error('获取小说时出错:', error);
                resolve(null);
            }
        });
    }
    
    // 更新小说的时间戳（最后访问时间）
    async updateNovelTimestamp(novelId) {
        if (!this.isSupported || !this.db) return;
        
        try {
            const transaction = this.db.transaction(['novels'], 'readwrite');
            const store = transaction.objectStore('novels');
            
            const request = store.get(parseInt(novelId));
            request.onsuccess = (event) => {
                const novel = event.target.result;
                if (novel) {
                    novel.timestamp = Date.now();
                    store.put(novel);
                }
            };
            
            request.onerror = (event) => {
                console.debug('更新时间戳失败:', event.target.error);
            };
        } catch (error) {
            console.debug('更新时间戳时出错:', error);
        }
    }
    
    // 删除离线小说
    async deleteNovel(novelId) {
        if (!this.isSupported) {
            throw new Error('浏览器不支持离线功能');
        }
        
        if (!this.db) {
            try {
                await this.initDatabase();
            } catch (error) {
                console.error('数据库初始化失败:', error);
                throw error;
            }
        }
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['novels'], 'readwrite');
                const store = transaction.objectStore('novels');
                const request = store.delete(parseInt(novelId));
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('删除小说失败:', event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('删除小说时出错:', error);
                reject(error);
            }
        });
    }
    
    // 获取所有离线小说列表
    async getAllNovels() {
        if (!this.db) await this.initDatabase();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['novels'], 'readonly');
            const store = transaction.objectStore('novels');
            const request = store.getAll();
            
            request.onsuccess = (event) => {
                const novels = event.target.result;
                resolve(novels || []);
            };
            
            request.onerror = (event) => {
                console.error('获取离线小说列表失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    // 下载小说到离线存储
    async downloadNovel(novelId) {
        // 先检查是否已经离线保存
        const existingNovel = await this.getNovel(novelId);
        if (existingNovel) {
            return { success: true, message: '小说已离线保存', novel: existingNovel };
        }
        
        // 检查网络状态
        if (!this.isOnline()) {
            this.addToDownloadQueue(novelId);
            return { success: false, message: '网络已断开，已添加到下载队列' };
        }
        
        try {
            console.log(`正在从API获取小说数据: /api/novels/${novelId}`);

            const response = await fetch(`/api/novels/${novelId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log(`API响应状态: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API错误响应: ${response.status} - ${errorText}`);
                throw new Error(`API返回错误: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API返回数据:', data);

            if (!data.success || !data.data) {
                throw new Error(`获取小说数据失败: ${data.message || '未知错误'}`);
            }
            
            // 检查存储空间
            await this.checkAndCleanStorage(data.data);
            
            // 保存到离线存储
            const savedNovel = await this.saveNovel(data.data);
            
            // 通知保存成功
            if (typeof showToast === 'function') {
                showToast(`《${savedNovel.title}》已保存到离线阅读库`, 'success');
            } else if (window.Utils && typeof window.Utils.showToast === 'function') {
                window.Utils.showToast(`《${savedNovel.title}》已保存到离线阅读库`, 'success');
            }
            
            return { success: true, message: '小说已保存到离线阅读库', novel: savedNovel };
        } catch (error) {
            console.error('下载小说失败:', error);
            
            // 添加到下载队列，稍后重试
            this.addToDownloadQueue(novelId);
            
            return { success: false, message: `下载失败: ${error.message}，已加入下载队列`, error };
        }
    }
    
    // 添加到下载队列
    addToDownloadQueue(novelId) {
        const task = {
            novelId: parseInt(novelId),
            status: 'pending',
            timestamp: Date.now(),
            retries: 0
        };
        
        if (!this.db) {
            this.downloadQueue.push(task);
            return;
        }
        
        const transaction = this.db.transaction(['downloadTasks'], 'readwrite');
        const store = transaction.objectStore('downloadTasks');
        store.add(task);
        
        // 如果在线且队列未处理，开始处理
        if (this.isOnline() && !this.isProcessingQueue) {
            this.processDownloadQueue();
        }
    }
    
    // 处理下载队列
    async processDownloadQueue() {
        if (!this.isOnline() || this.isProcessingQueue) return;
        
        this.isProcessingQueue = true;
        
        if (!this.db) await this.initDatabase();
        
        const transaction = this.db.transaction(['downloadTasks'], 'readwrite');
        const store = transaction.objectStore('downloadTasks');
        const index = store.index('status');
        const request = index.getAll('pending');
        
        request.onsuccess = async (event) => {
            const tasks = event.target.result;
            
            for (const task of tasks) {
                if (!this.isOnline()) {
                    this.isProcessingQueue = false;
                    return;
                }
                
                try {
                    const result = await this.downloadNovel(task.novelId);
                    
                    // 更新任务状态
                    const updateTransaction = this.db.transaction(['downloadTasks'], 'readwrite');
                    const updateStore = updateTransaction.objectStore('downloadTasks');
                    
                    if (result.success) {
                        // 成功，删除任务
                        updateStore.delete(task.id);
                    } else {
                        // 失败，增加重试次数
                        task.retries++;
                        task.lastError = result.message;
                        
                        if (task.retries >= 3) {
                            task.status = 'failed';
                        }
                        
                        updateStore.put(task);
                    }
                } catch (error) {
                    console.error('处理下载队列任务失败:', error);
                }
            }
            
            this.isProcessingQueue = false;
        };
        
        request.onerror = (event) => {
            console.error('获取下载队列失败:', event.target.error);
            this.isProcessingQueue = false;
        };
    }
    
    // 获取缓存使用情况
    async getStorageUsage() {
        if (!this.db) await this.initDatabase();
        
        const novels = await this.getAllNovels();
        
        let totalSize = 0;
        let novelCount = novels.length;
        
        for (const novel of novels) {
            totalSize += novel.size || 0;
        }
        
        return {
            totalSize,
            sizeLimit: this.storageLimit,
            usedPercentage: Math.round((totalSize / this.storageLimit) * 100),
            novelCount
        };
    }
    
    // 估算内容大小
    estimateSize(novel) {
        let size = 0;
        
        // 标题和作者
        size += (novel.title?.length || 0) * 2;
        size += (novel.author?.length || 0) * 2;
        
        // 内容
        size += (novel.content?.length || 0) * 2;
        
        // 摘要和标签
        size += (novel.summary?.length || 0) * 2;
        size += JSON.stringify(novel.tags || []).length;
        
        // 其他元数据
        size += JSON.stringify(novel).length;
        
        return size;
    }
    
    // 检查存储空间并清理过期数据
    async checkAndCleanStorage(newNovel = null) {
        const usage = await this.getStorageUsage();
        const newSize = newNovel ? this.estimateSize(newNovel) : 0;
        
        // 如果添加新内容后超过限制，清理旧数据
        if (usage.totalSize + newSize > this.storageLimit) {
            const novels = await this.getAllNovels();
            
            // 按最后访问时间排序
            novels.sort((a, b) => a.timestamp - b.timestamp);
            
            let freedSpace = 0;
            const needToFree = usage.totalSize + newSize - this.storageLimit + 1024 * 1024; // 额外释放1MB空间
            
            for (const novel of novels) {
                await this.deleteNovel(novel.id);
                freedSpace += novel.size || 0;
                
                if (freedSpace > needToFree) break;
            }
        }
    }
    
    // 清除全部离线数据
    async clearAllOfflineData() {
        if (!this.db) await this.initDatabase();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['novels', 'downloadTasks'], 'readwrite');
            
            // 清除小说
            const novelStore = transaction.objectStore('novels');
            const novelClear = novelStore.clear();
            
            // 清除下载任务
            const taskStore = transaction.objectStore('downloadTasks');
            const taskClear = taskStore.clear();
            
            transaction.oncomplete = () => {
                resolve(true);
            };
            
            transaction.onerror = (event) => {
                console.error('清除离线数据失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    // 设置存储限制
    setStorageLimit(limitInMB) {
        const limit = Math.max(10, Math.min(500, limitInMB)) * 1024 * 1024; // 限制在10-500MB之间
        this.storageLimit = limit;
        localStorage.setItem('offline_storage_limit', limit.toString());
    }
    
    // 检查小说是否离线可用
    async isNovelAvailableOffline(novelId) {
        const novel = await this.getNovel(novelId);
        return !!novel;
    }
    
    // 注册Toast通知函数
    registerToastFunction(toastFn) {
        this.showToast = toastFn;
    }
}

// 导出为全局变量
window.OfflineReaderManager = OfflineReaderManager; 