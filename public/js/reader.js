// 阅读页面功能实现
class NovelReader {
    constructor() {
        this.novelId = this.getNovelIdFromUrl();
        this.settings = this.loadSettings();
        this.readingProgress = this.loadProgress();
        
        this.initializeElements();
        this.bindEvents();
        this.applySettings();
        this.loadNovel();
    }

    // 从URL参数获取小说ID
    getNovelIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (!id) {
            // 如果没有ID，显示错误并提供返回选项
            this.showError('未找到小说ID参数');
            return null;
        }
        return id;
    }

    // 加载用户设置
    loadSettings() {
        const defaultSettings = {
            fontSize: 16,
            theme: 'light'
        };
        
        const saved = localStorage.getItem('readerSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    // 加载阅读进度
    loadProgress() {
        const saved = localStorage.getItem(`novel-${this.novelId}-progress`);
        return saved ? JSON.parse(saved) : { position: 0, percentage: 0 };
    }

    // 初始化DOM元素
    initializeElements() {
        this.elements = {
            settingsBtn: document.getElementById('settingsBtn'),
            settingsPanel: document.getElementById('settingsPanel'),
            settingsOverlay: document.getElementById('settingsOverlay'),
            closeSettings: document.getElementById('closeSettings'),
            fontSizeUp: document.getElementById('fontSizeUp'),
            fontSizeDown: document.getElementById('fontSizeDown'),
            fontSizeLabel: document.getElementById('fontSizeLabel'),
            themeButtons: document.querySelectorAll('.theme-btn'),
            novelTitle: document.getElementById('novelTitle'),
            novelTitleMain: document.getElementById('novelTitleMain'),
            novelViews: document.getElementById('novelViews'),
            publishTime: document.getElementById('publishTime'),
            novelTags: document.getElementById('novelTags'),
            novelSummary: document.getElementById('novelSummary'),
            novelInfo: document.getElementById('novelInfo'),
            novelContent: document.getElementById('novelContent'),
            progressBar: document.getElementById('progressBar')
        };
    }

    // 绑定事件
    bindEvents() {
        // 设置面板控制
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.settingsOverlay.addEventListener('click', () => this.closeSettings());

        // 字体大小控制
        this.elements.fontSizeUp.addEventListener('click', () => this.changeFontSize(2));
        this.elements.fontSizeDown.addEventListener('click', () => this.changeFontSize(-2));

        // 主题切换
        this.elements.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.changeTheme(btn.dataset.theme));
        });

        // 滚动事件 - 用于进度保存和进度条更新
        let saveTimer;
        window.addEventListener('scroll', () => {
            this.updateProgressBar();
            
            // 防抖保存进度
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => this.saveProgress(), 1000);
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // 页面可见性变化时保存进度
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveProgress();
            }
        });

        // 页面卸载前保存进度
        window.addEventListener('beforeunload', () => {
            this.saveProgress();
        });
    }

    // 处理键盘快捷键
    handleKeyboardShortcuts(event) {
        // 如果在输入框中，不处理快捷键
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch(event.key) {
            case 'Escape':
                this.closeSettings();
                break;
            case 's':
            case 'S':
                event.preventDefault();
                this.openSettings();
                break;
            case '=':
            case '+':
                event.preventDefault();
                this.changeFontSize(2);
                break;
            case '-':
                event.preventDefault();
                this.changeFontSize(-2);
                break;
            case '1':
                event.preventDefault();
                this.changeTheme('light');
                break;
            case '2':
                event.preventDefault();
                this.changeTheme('sepia');
                break;
            case '3':
                event.preventDefault();
                this.changeTheme('dark');
                break;
        }
    }

    // 应用用户设置
    applySettings() {
        // 应用字体大小
        this.elements.novelContent.style.fontSize = `${this.settings.fontSize}px`;
        this.elements.fontSizeLabel.textContent = `${this.settings.fontSize}px`;

        // 应用主题
        document.body.className = `theme-${this.settings.theme}`;
        this.elements.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });

        // 应用设置面板主题
        this.updateSettingsPanelTheme();
    }

    // 更新设置面板主题
    updateSettingsPanelTheme() {
        const panel = this.elements.settingsPanel;
        const theme = this.settings.theme;
        
        if (theme === 'dark') {
            panel.style.background = '#2A2A2A';
            panel.style.color = '#E0E0E0';
        } else if (theme === 'sepia') {
            panel.style.background = '#FFF9F0';
            panel.style.color = '#5C4033';
        } else {
            panel.style.background = 'white';
            panel.style.color = '#333333';
        }
    }

    // 加载小说内容
    async loadNovel() {
        try {
            // 尝试从API加载
            const response = await fetch('/api/novels');
            if (response.ok) {
                const data = await response.json();
                const novel = data.novels.find(n => n.id.toString() === this.novelId);

                if (novel) {
                    this.displayNovel(novel);
                    return;
                }
            }

            // 如果没有找到，显示示例内容
            this.displaySampleNovel();

        } catch (error) {
            console.error('加载小说失败:', error);
            this.displaySampleNovel();
        }
    }

    // 显示小说内容
    displayNovel(novel) {
        // 更新页面标题
        document.title = `${novel.title} - 小红书风格小说网站`;
        
        // 更新标题
        this.elements.novelTitle.textContent = novel.title;
        this.elements.novelTitleMain.textContent = novel.title;
        
        // 更新小说信息
        this.elements.novelViews.textContent = this.formatViews(novel.views || 0);
        this.elements.publishTime.textContent = this.formatPublishTime(novel.publishTime);
        this.elements.novelSummary.textContent = novel.summary || '暂无简介';
        
        // 更新标签
        if (novel.tags && novel.tags.length > 0) {
            this.elements.novelTags.innerHTML = novel.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        }
        
        // 显示小说信息卡片
        this.elements.novelInfo.style.display = 'block';
        
        // 格式化并显示内容
        const content = novel.content || this.generateSampleContent(novel.title);
        this.elements.novelContent.innerHTML = this.formatContent(content);

        // 恢复阅读位置
        setTimeout(() => this.restoreProgress(), 100);
        
        // 增加阅读量（模拟）
        this.incrementViews(novel.id);
    }

    // 显示示例小说
    displaySampleNovel() {
        const sampleTitle = `示例小说 ${this.novelId}`;
        const sampleContent = this.generateSampleContent(sampleTitle);
        
        // 更新页面标题
        document.title = `${sampleTitle} - 小红书风格小说网站`;
        
        this.elements.novelTitle.textContent = sampleTitle;
        this.elements.novelTitleMain.textContent = sampleTitle;
        
        // 设置示例信息
        this.elements.novelViews.textContent = Math.floor(Math.random() * 5000 + 1000).toString();
        this.elements.publishTime.textContent = '3天前';
        this.elements.novelSummary.textContent = '这是一个示例小说，展示阅读器的各种功能。';
        this.elements.novelTags.innerHTML = '<span class="tag">#示例</span><span class="tag">#测试</span>';
        
        // 显示小说信息卡片
        this.elements.novelInfo.style.display = 'block';
        
        this.elements.novelContent.innerHTML = this.formatContent(sampleContent);

        setTimeout(() => this.restoreProgress(), 100);
    }

    // 生成示例内容
    generateSampleContent(title) {
        return `这是《${title}》的开头。

        夜色如墨，城市的霓虹灯闪烁着迷离的光影。她站在24楼的落地窗前，俯视着这座从不睡眠的都市。

        手机突然响起，屏幕上显示着一个陌生的号码。她犹豫了一下，最终还是接了起来。

        "喂？"

        "终于接电话了。"电话那头传来一个低沉磁性的声音，带着淡淡的笑意。

        她的心跳突然加速，这个声音...她永远不会忘记。

        "是你？"她的声音有些颤抖。

        "是我。我回来了。"

        三年了，整整三年。她以为自己已经忘记了，忘记了那个让她心动的人，忘记了那段刻骨铭心的感情。

        可是现在，仅仅是听到他的声音，所有的记忆都如潮水般涌回。

        "为什么现在才联系我？"她努力让自己的声音听起来平静。

        "因为我想你了。"他的声音很轻，轻得像羽毛，却重重地击在她的心上。

        她闭上眼睛，泪水不争气地滑落。

        "我们见个面好吗？就像以前一样，在那家咖啡店。"

        那家咖啡店，他们第一次相遇的地方，也是最后一次告别的地方。

        "好。"她听到自己说道，声音轻得几乎听不见。

        挂断电话后，她看着镜子中的自己。三年的时间，她变得更加成熟，更加独立，但是内心深处，对他的感情从未改变。

        明天，她将再次见到他。

        心情复杂如这夜色，既期待又忐忑。

        她不知道明天会发生什么，但她知道，有些人一旦出现在你的生命里，就再也无法彻底消失。

        就像现在，仅仅是一个电话，就让她的世界重新有了色彩。

        也许，这就是命运的安排。

        也许，有些爱情值得等待。

        夜深了，但她却毫无睡意。她站在窗前，看着城市的灯火，想着明天的相遇，心中五味杂陈。

        这个夜晚，注定无眠。`;
    }

    // 打开设置面板
    openSettings() {
        this.elements.settingsPanel.classList.add('active');
        this.elements.settingsOverlay.classList.remove('opacity-0', 'invisible');
        this.elements.settingsOverlay.classList.add('opacity-100', 'visible');
        document.body.style.overflow = 'hidden';
    }

    // 关闭设置面板
    closeSettings() {
        this.elements.settingsPanel.classList.remove('active');
        this.elements.settingsOverlay.classList.remove('opacity-100', 'visible');
        this.elements.settingsOverlay.classList.add('opacity-0', 'invisible');
        document.body.style.overflow = '';
    }

    // 改变字体大小
    changeFontSize(delta) {
        const newSize = Math.max(14, Math.min(24, this.settings.fontSize + delta));
        if (newSize === this.settings.fontSize) {
            const message = newSize === 14 ? '字体已经是最小了' : '字体已经是最大了';
            this.showToast(message, 'info');
            return;
        }

        this.settings.fontSize = newSize;

        this.elements.novelContent.style.fontSize = `${newSize}px`;
        this.elements.fontSizeLabel.textContent = `${newSize}px`;

        this.saveSettings();
        this.showToast(`字体大小已调整为 ${newSize}px`);
    }

    // 改变主题
    changeTheme(theme) {
        if (theme === this.settings.theme) {
            return;
        }

        this.settings.theme = theme;

        document.body.className = `theme-${theme}`;
        this.elements.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });

        this.updateSettingsPanelTheme();
        this.saveSettings();

        const themeNames = {
            'light': '白天模式',
            'sepia': '护眼模式',
            'dark': '夜间模式'
        };
        this.showToast(`已切换到${themeNames[theme]}`);
    }

    // 更新进度条
    updateProgressBar() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const percentage = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0;
        
        this.elements.progressBar.style.width = `${percentage}%`;
    }

    // 保存阅读进度
    saveProgress() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const percentage = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0;
        
        const progress = {
            position: scrolled,
            percentage: percentage,
            timestamp: Date.now()
        };
        
        localStorage.setItem(`novel-${this.novelId}-progress`, JSON.stringify(progress));
    }

    // 恢复阅读进度
    restoreProgress() {
        if (this.readingProgress.position > 0) {
            window.scrollTo({
                top: this.readingProgress.position,
                behavior: 'smooth'
            });
        }
    }

    // 保存设置
    saveSettings() {
        localStorage.setItem('readerSettings', JSON.stringify(this.settings));
    }

    // 格式化内容
    formatContent(content) {
        if (!content) return '<p class="text-center text-gray-500 py-8">暂无内容</p>';
        
        const paragraphs = content.split('\n').filter(p => p.trim());
        
        return paragraphs.map(paragraph => {
            paragraph = paragraph.trim();
            
            // 检查是否是章节标题
            if (paragraph.match(/^第.+章/)) {
                return `<h2 class="text-xl font-bold mt-8 mb-4 text-center">${paragraph}</h2>`;
            }
            
            // 检查是否是其他标题格式
            if (paragraph.match(/^【.+】$/) || paragraph.match(/^\d+\./)) {
                return `<h3 class="text-lg font-semibold mt-6 mb-3">${paragraph}</h3>`;
            }
            
            // 普通段落
            return `<p>${paragraph}</p>`;
        }).join('');
    }

    // 格式化阅读量
    formatViews(views) {
        if (views >= 10000) {
            return Math.floor(views / 1000) / 10 + 'w';
        } else if (views >= 1000) {
            return Math.floor(views / 100) / 10 + 'k';
        }
        return views.toString();
    }

    // 格式化发布时间
    formatPublishTime(publishTime) {
        if (!publishTime) return '未知时间';
        
        const date = new Date(publishTime);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1天前';
        if (diffDays < 7) return `${diffDays}天前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
        return `${Math.floor(diffDays / 365)}年前`;
    }

    // 增加阅读量（模拟功能）
    incrementViews(novelId) {
        const viewKey = `novel-${novelId}-viewed`;
        const lastViewed = localStorage.getItem(viewKey);
        const now = Date.now();
        
        // 如果距离上次查看超过1小时，则增加阅读量
        if (!lastViewed || (now - parseInt(lastViewed)) > 3600000) {
            localStorage.setItem(viewKey, now.toString());
            // 这里可以发送请求到服务器增加阅读量
            console.log(`增加小说${novelId}的阅读量`);
        }
    }

    // 显示错误信息
    showError(message) {
        this.elements.novelContent.innerHTML = `
            <div class="text-center py-20">
                <div class="text-6xl mb-4">😔</div>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">出错了</h2>
                <p class="text-gray-500 mb-6">${message}</p>
                <div class="space-x-4">
                    <button onclick="location.reload()"
                            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        重新加载
                    </button>
                    <button onclick="window.history.back()"
                            class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        返回上一页
                    </button>
                </div>
            </div>
        `;
    }

    // 显示成功提示
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化阅读器
document.addEventListener('DOMContentLoaded', () => {
    new NovelReader();
});