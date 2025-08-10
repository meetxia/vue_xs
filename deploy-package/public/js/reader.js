// 阅读页面功能实现
class NovelReader {
    constructor() {
        this.novelId = this.getNovelIdFromUrl();
        this.settings = this.loadSettings();
        this.readingProgress = this.loadProgress();

        // 初始化阅读追踪器
        this.readingTracker = null;
        this.initReadingTracker();

        // 初始化分页管理器
        this.paginationManager = null;
        this.initPaginationManager();

        this.initializeElements();
        this.initializeFeatureModules();
        this.bindEvents();
        this.applySettings();

        // 确保设置面板初始状态是隐藏的
        this.ensureSettingsPanelHidden();

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

    // 初始化阅读追踪器
    initReadingTracker() {
        if (typeof initReadingTracker === 'function') {
            this.readingTracker = initReadingTracker(window.userManager);
        } else {
            console.warn('阅读追踪器未加载');
        }
    }

    // 开始阅读追踪
    startReadingTracking() {
        if (this.readingTracker && this.novelId) {
            this.readingTracker.startTracking(parseInt(this.novelId));
        }
    }

    // 停止阅读追踪
    stopReadingTracking() {
        if (this.readingTracker) {
            this.readingTracker.stopTracking(true);
        }
    }

    // 加载用户设置
    loadSettings() {
        const defaultSettings = {
            fontSize: 16,
            theme: 'light',
            // 智能排版设置
            lineHeight: 'auto', // auto, 1.5, 1.8, 2.0, 2.2
            letterSpacing: 'auto', // auto, normal, 0.5px, 1px, 1.5px
            paragraphSpacing: 'auto', // auto, normal, large, extra-large
            textAlign: 'justify', // left, justify
            // 字体设置
            fontFamily: 'system', // system, serif, sans-serif, source-han-serif, source-han-sans, noto-serif, noto-sans, fang-song, kai-ti
            fontWeight: '400', // 300, 400, 500, 600, 700
            // 页面设置
            pageWidth: 'auto', // auto, narrow, medium, wide
            marginSize: 'auto', // auto, small, medium, large
            // 自定义主题设置
            customTheme: {
                backgroundColor: '#FAF5F0',
                textColor: '#333333',
                contentBackgroundColor: '#FFFFFF'
            }
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
            // 智能排版控件
            lineHeightSelect: document.getElementById('lineHeightSelect'),
            letterSpacingSelect: document.getElementById('letterSpacingSelect'),
            fontFamilySelect: document.getElementById('fontFamilySelect'),
            fontWeightSelect: document.getElementById('fontWeightSelect'),
            fontSizeSlider: document.getElementById('fontSizeSlider'),
            fontSizeValue: document.getElementById('fontSizeValue'),
            fontPreview: document.getElementById('fontPreview'),
            alignButtons: document.querySelectorAll('.align-btn'),
            // 自定义主题控件
            customThemeBtn: document.getElementById('customThemeBtn'),
            customThemePanel: document.getElementById('customThemePanel'),
            closeCustomTheme: document.getElementById('closeCustomTheme'),
            bgColorPicker: document.getElementById('bgColorPicker'),
            bgColorInput: document.getElementById('bgColorInput'),
            textColorPicker: document.getElementById('textColorPicker'),
            textColorInput: document.getElementById('textColorInput'),
            contentBgColorPicker: document.getElementById('contentBgColorPicker'),
            contentBgColorInput: document.getElementById('contentBgColorInput'),
            presetColorBtns: document.querySelectorAll('.preset-color-btn'),
            applyCustomTheme: document.getElementById('applyCustomTheme'),
            resetCustomTheme: document.getElementById('resetCustomTheme'),
            // 内容元素
            novelTitle: document.getElementById('novelTitle'),
            novelTitleMain: document.getElementById('novelTitleMain'),
            novelViews: document.getElementById('novelViews'),
            publishTime: document.getElementById('publishTime'),
            novelTags: document.getElementById('novelTags'),
            novelSummary: document.getElementById('novelSummary'),
            novelInfo: document.getElementById('novelInfo'),
            novelContent: document.getElementById('novelContent'),
            progressBar: document.getElementById('progressBar'),
            // TTS控件
            voiceSelect: document.getElementById('voiceSelect'),
            speechRateSlider: document.getElementById('speechRateSlider'),
            speechRateValue: document.getElementById('speechRateValue'),
            speechPitchSlider: document.getElementById('speechPitchSlider'),
            speechPitchValue: document.getElementById('speechPitchValue'),
            speechVolumeSlider: document.getElementById('speechVolumeSlider'),
            speechVolumeValue: document.getElementById('speechVolumeValue'),
            ttsTestBtn: document.getElementById('ttsTestBtn'),
            ttsResetBtn: document.getElementById('ttsResetBtn'),
            analyticsBtn: document.getElementById('analyticsBtn'),
            ttsBtn: document.getElementById('ttsBtn'),
            searchBtn: document.getElementById('searchBtn'),
            notesBtn: document.getElementById('notesBtn')

        };
        
    }

    // 初始化功能模块
    initializeFeatureModules() {
        // 初始化阅读统计模块
        if (typeof ReadingAnalytics !== 'undefined') {
            this.readingAnalytics = new ReadingAnalytics(this.novelId);
        }

        // 初始化TTS语音朗读模块
        if (typeof TTSReader !== 'undefined') {
            this.ttsReader = new TTSReader();
            this.ttsReader.onReadingStart = () => {
                this.elements.ttsBtn.innerHTML = '⏸️';
                this.elements.ttsBtn.title = '暂停朗读';
            };
            this.ttsReader.onReadingEnd = () => {
                this.elements.ttsBtn.innerHTML = '🔊';
                this.elements.ttsBtn.title = '语音朗读';
            };
            this.ttsReader.onReadingPause = () => {
                this.elements.ttsBtn.innerHTML = '▶️';
                this.elements.ttsBtn.title = '继续朗读';
            };
            this.ttsReader.onReadingResume = () => {
                this.elements.ttsBtn.innerHTML = '⏸️';
                this.elements.ttsBtn.title = '暂停朗读';
            };
        }

        // 初始化阅读笔记模块
        if (typeof ReadingNotes !== 'undefined') {
            this.readingNotes = new ReadingNotes(this.novelId);
        }

        // 初始化全文搜索模块 - 延迟初始化，等待内容加载
        this.fullTextSearch = null;
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

        // 智能排版设置事件
        this.elements.lineHeightSelect.addEventListener('change', (e) => {
            this.settings.lineHeight = e.target.value;
            this.applySmartTypography();
            this.saveSettings();
            this.showToast('行距已更新');
        });

        this.elements.letterSpacingSelect.addEventListener('change', (e) => {
            this.settings.letterSpacing = e.target.value;
            this.applySmartTypography();
            this.saveSettings();
            this.showToast('字距已更新');
        });

        this.elements.fontFamilySelect.addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.updateFontPreview();
            this.applySmartTypography();
            this.saveSettings();
            this.showToast('字体已更新');
        });

        this.elements.fontWeightSelect.addEventListener('change', (e) => {
            this.settings.fontWeight = e.target.value;
            this.updateFontPreview();
            this.applySmartTypography();
            this.saveSettings();
            this.showToast('字体粗细已更新');
        });

        this.elements.fontSizeSlider.addEventListener('input', (e) => {
            const newSize = parseFloat(e.target.value);
            this.settings.fontSize = newSize;
            this.elements.fontSizeValue.textContent = `${newSize}px`;
            this.elements.fontSizeLabel.textContent = `${newSize}px`;
            this.elements.novelContent.style.fontSize = `${newSize}px`;
            this.updateFontPreview();
            this.applySmartTypography();
            this.saveSettings();
        });

        this.elements.alignButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.alignButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.textAlign = btn.dataset.align;
                this.applySmartTypography();
                this.saveSettings();
                this.showToast(`已切换到${btn.textContent}`);
            });
        });

        // 自定义主题面板事件
        this.elements.customThemeBtn.addEventListener('click', () => this.openCustomThemePanel());
        this.elements.closeCustomTheme.addEventListener('click', () => this.closeCustomThemePanel());

        // 颜色选择器同步
        this.elements.bgColorPicker.addEventListener('input', (e) => {
            this.elements.bgColorInput.value = e.target.value;
        });
        this.elements.bgColorInput.addEventListener('input', (e) => {
            this.elements.bgColorPicker.value = e.target.value;
        });

        this.elements.textColorPicker.addEventListener('input', (e) => {
            this.elements.textColorInput.value = e.target.value;
        });
        this.elements.textColorInput.addEventListener('input', (e) => {
            this.elements.textColorPicker.value = e.target.value;
        });

        this.elements.contentBgColorPicker.addEventListener('input', (e) => {
            this.elements.contentBgColorInput.value = e.target.value;
        });
        this.elements.contentBgColorInput.addEventListener('input', (e) => {
            this.elements.contentBgColorPicker.value = e.target.value;
        });

        // 预设颜色方案
        this.elements.presetColorBtns.forEach(btn => {
            btn.addEventListener('click', () => this.applyPresetColors(btn.dataset.preset));
        });

        // 应用和重置按钮
        this.elements.applyCustomTheme.addEventListener('click', () => this.applyCustomThemeColors());
        this.elements.resetCustomTheme.addEventListener('click', () => this.resetCustomThemeColors());

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

        // 窗口大小变化时重新应用智能排版
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.applySmartTypography();
            }, 300); // 防抖处理
        });

        // 功能按钮事件绑定
        // 阅读笔记按钮
        this.elements.notesBtn.addEventListener('click', () => this.toggleNotesPanel());

        // 全文搜索按钮  
        this.elements.searchBtn.addEventListener('click', () => this.toggleSearchPanel());

        // 语音朗读按钮
        this.elements.ttsBtn.addEventListener('click', () => this.toggleTTSReading());

        // 阅读统计按钮
        this.elements.analyticsBtn.addEventListener('click', () => this.openAnalyticsPanel());

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

        // 初始化设置控件状态
        this.initializeSettingsControls();

        // 应用智能排版设置
        this.applySmartTypography();

        // 应用设置面板主题
        this.updateSettingsPanelTheme();
    }

    // 初始化设置控件状态
    initializeSettingsControls() {
        // 设置行距选择器
        this.elements.lineHeightSelect.value = this.settings.lineHeight;

        // 设置字距选择器
        this.elements.letterSpacingSelect.value = this.settings.letterSpacing;

        // 设置字体选择器
        this.elements.fontFamilySelect.value = this.settings.fontFamily;

        // 设置字体粗细选择器
        this.elements.fontWeightSelect.value = this.settings.fontWeight;

        // 设置字体大小滑块
        this.elements.fontSizeSlider.value = this.settings.fontSize;
        this.elements.fontSizeValue.textContent = `${this.settings.fontSize}px`;

        // 设置对齐按钮状态
        this.elements.alignButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === this.settings.textAlign);
        });

        // 如果当前是自定义主题，应用自定义样式
        if (this.settings.theme === 'custom') {
            this.applyCustomThemeStyles();
        }

        // 更新字体预览
        this.updateFontPreview();
    }

    // 更新字体预览
    updateFontPreview() {
        if (!this.elements.fontPreview) return;

        // 应用当前字体设置到预览区域
        const fontFamily = this.getFontFamilyCSS(this.settings.fontFamily);
        this.elements.fontPreview.style.fontFamily = fontFamily;
        this.elements.fontPreview.style.fontWeight = this.settings.fontWeight;
        this.elements.fontPreview.style.fontSize = `${this.settings.fontSize}px`;

        // 应用当前主题的颜色
        if (this.settings.theme === 'custom') {
            this.elements.fontPreview.style.color = this.settings.customTheme.textColor;
            this.elements.fontPreview.style.backgroundColor = this.settings.customTheme.contentBackgroundColor;
        } else {
            // 重置为默认样式，让CSS主题生效
            this.elements.fontPreview.style.color = '';
            this.elements.fontPreview.style.backgroundColor = '';
        }
    }

    // 获取字体CSS字符串
    getFontFamilyCSS(fontFamily) {
        switch (fontFamily) {
            case 'serif':
                return '"SimSun", "宋体", "Times New Roman", serif';
            case 'sans-serif':
                return '"Microsoft YaHei", "微软雅黑", "PingFang SC", "Helvetica Neue", sans-serif';
            case 'source-han-serif':
                return '"Source Han Serif SC", "思源宋体", "Noto Serif CJK SC", "SimSun", serif';
            case 'source-han-sans':
                return '"Source Han Sans SC", "思源黑体", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
            case 'noto-serif':
                return '"Noto Serif SC", "Source Han Serif SC", "SimSun", serif';
            case 'noto-sans':
                return '"Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif';
            case 'fang-song':
                return '"FangSong", "仿宋", "STFangsong", "华文仿宋", serif';
            case 'kai-ti':
                return '"KaiTi", "楷体", "STKaiti", "华文楷体", serif';
            default:
                return '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
        }
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

    // 智能排版系统核心方法
    applySmartTypography() {
        const content = this.elements.novelContent;
        if (!content) return;

        // 获取屏幕信息
        const screenInfo = this.getScreenInfo();

        // 计算最优排版参数
        const typographyParams = this.calculateOptimalTypography(screenInfo);

        // 应用排版样式
        this.applyTypographyStyles(content, typographyParams);

        // 保存计算结果到设置中
        this.updateTypographySettings(typographyParams);
    }

    // 获取屏幕信息
    getScreenInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            isMobile: window.innerWidth <= 768,
            isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
            isDesktop: window.innerWidth > 1024,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        };
    }

    // 计算最优排版参数
    calculateOptimalTypography(screenInfo) {
        const fontSize = this.settings.fontSize;
        const baseParams = {
            fontSize: fontSize,
            lineHeight: 1.8,
            letterSpacing: 0,
            paragraphSpacing: 1.5,
            maxWidth: 800,
            padding: 32
        };

        // 根据字体大小调整行距
        if (fontSize <= 14) {
            baseParams.lineHeight = 1.9;
        } else if (fontSize >= 20) {
            baseParams.lineHeight = 1.7;
        }

        // 根据屏幕尺寸调整参数
        if (screenInfo.isMobile) {
            baseParams.maxWidth = Math.min(screenInfo.width - 32, 600);
            baseParams.padding = 20;
            baseParams.lineHeight += 0.1; // 移动端增加行距

            if (screenInfo.orientation === 'portrait') {
                baseParams.letterSpacing = 0.3; // 竖屏时增加字距
            }
        } else if (screenInfo.isTablet) {
            baseParams.maxWidth = Math.min(screenInfo.width - 64, 700);
            baseParams.padding = 28;
        } else {
            // 桌面端根据屏幕宽度调整
            if (screenInfo.width > 1400) {
                baseParams.maxWidth = 900;
                baseParams.padding = 40;
            }
        }

        // 根据用户设置覆盖自动计算的值
        if (this.settings.lineHeight !== 'auto') {
            baseParams.lineHeight = parseFloat(this.settings.lineHeight);
        }

        if (this.settings.letterSpacing !== 'auto') {
            if (this.settings.letterSpacing === 'normal') {
                baseParams.letterSpacing = 0;
            } else {
                baseParams.letterSpacing = parseFloat(this.settings.letterSpacing);
            }
        }

        return baseParams;
    }

    // 应用排版样式
    applyTypographyStyles(content, params) {
        // 设置容器样式
        const container = content.closest('.reader-container');
        if (container) {
            container.style.maxWidth = `${params.maxWidth}px`;
        }

        // 设置内容区域样式
        content.style.lineHeight = params.lineHeight;
        content.style.letterSpacing = `${params.letterSpacing}px`;
        content.style.padding = `${params.padding}px`;

        // 设置段落样式
        const paragraphs = content.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.style.marginBottom = `${params.paragraphSpacing}em`;

            // 根据设置应用文本对齐
            if (this.settings.textAlign === 'justify') {
                p.style.textAlign = 'justify';
                p.style.textJustify = 'inter-ideograph'; // 中文优化
            } else {
                p.style.textAlign = this.settings.textAlign;
            }
        });

        // 设置标题样式
        const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.style.lineHeight = Math.max(1.3, params.lineHeight - 0.3);
            heading.style.letterSpacing = `${Math.max(0, params.letterSpacing - 0.2)}px`;
        });

        // 应用字体设置
        this.applyFontSettings(content);
    }

    // 应用字体设置
    applyFontSettings(content) {
        const fontFamily = this.getFontFamilyCSS(this.settings.fontFamily);

        content.style.fontFamily = fontFamily;
        content.style.fontWeight = this.settings.fontWeight;

        // 为特定字体添加字体加载检测
        this.ensureFontLoaded(this.settings.fontFamily);
    }

    // 确保字体加载
    ensureFontLoaded(fontFamily) {
        const fontMap = {
            'source-han-serif': 'Source Han Serif SC',
            'source-han-sans': 'Source Han Sans SC',
            'noto-serif': 'Noto Serif SC',
            'noto-sans': 'Noto Sans SC'
        };

        const fontName = fontMap[fontFamily];
        if (fontName && 'fonts' in document) {
            document.fonts.load(`16px "${fontName}"`).then(() => {
                console.log(`字体 ${fontName} 加载完成`);
            }).catch((error) => {
                console.warn(`字体 ${fontName} 加载失败:`, error);
                this.showToast(`字体加载失败，使用备用字体`, 'warning');
            });
        }
    }

    // 更新排版设置
    updateTypographySettings(params) {
        // 如果是自动模式，更新计算出的值
        if (this.settings.lineHeight === 'auto') {
            this.calculatedLineHeight = params.lineHeight;
        }
        if (this.settings.letterSpacing === 'auto') {
            this.calculatedLetterSpacing = params.letterSpacing;
        }
    }

    // 加载小说内容
    async loadNovel() {
        if (!this.novelId) {
            this.showError('缺少小说ID参数');
            return;
        }

        try {
            // 显示加载状态
            this.elements.novelContent.innerHTML = `
                <div class="text-center py-20">
                    <div class="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p class="text-gray-500">正在加载小说内容...</p>
                </div>
            `;

            // 离线功能已移除，直接检查网络
            if (!navigator.onLine) {
                console.log('网络已断开，无法加载小说');
                this.showError('网络已断开，无法加载小说内容。请检查网络连接后重试。');
                return;
            }
            
            // 尝试从API加载
            console.log('正在请求小说ID:', this.novelId);

            // 准备请求头，包含认证token
            const headers = {
                'Content-Type': 'application/json'
            };

            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('发送请求时包含认证token');
            } else {
                console.log('未找到认证token，以游客身份请求');
            }

            const response = await fetch('/api/novels/' + this.novelId, {
                method: 'GET',
                headers: headers
            });
            console.log('API响应状态:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('API响应数据:', data);
                
                if (data.success && data.data) {
                    this.displayNovel(data.data);
                    return;
                } else {
                    console.error('API返回失败:', data);
                    this.showError(data.message || '获取小说内容失败');
                    return;
                }
            } else {
                console.error('API请求失败，状态码:', response.status);
                // 如果是404，显示小说不存在
                if (response.status === 404) {
                    this.showError('小说不存在');
                    return;
                }
            }

            // 如果API失败，尝试显示示例内容
            console.log('API加载失败，显示示例内容');
            this.displaySampleNovel();

        } catch (error) {
            console.error('加载小说失败:', error);
            
            // 离线功能已移除
            
            // 最后兜底：显示错误信息
            this.showError('加载失败: ' + (error.message || '网络连接错误'));
        }
    }

    // 显示小说内容
    displayNovel(novel) {
        console.log('开始显示小说内容:', novel);

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

        // 启动阅读追踪
        setTimeout(() => {
            this.startReadingTracking();
        }, 1000); // 延迟1秒启动，确保页面渲染完成

        // 检查权限
        if (novel.hasAccess === false) {
            console.log('用户没有访问权限，显示权限提示');
            this.showAccessDenied(novel);
            return;
        }

        // 检查小说内容
        let content = novel.content;
        console.log('小说原始内容:', content);

        // 如果没有内容或内容为空，生成示例内容
        if (!content || content.trim() === '') {
            console.log('小说内容为空，生成示例内容');
            content = this.generateSampleContent(novel.title);
        }
        
        // 格式化并显示内容
        const formattedContent = this.formatContent(content);
        console.log('格式化后的内容:', formattedContent);
        
        // 使用分页管理器处理内容
        if (this.paginationManager) {
            console.log('使用分页管理器处理内容');
            this.paginationManager.processContent(formattedContent);
        } else {
            // 如果分页管理器不可用，直接显示内容
            console.log('分页管理器不可用，直接显示内容');
            this.elements.novelContent.innerHTML = formattedContent;
        }

        // 兜底检查：如果内容区域仍然显示加载状态，强制更新
        setTimeout(() => {
            const contentElement = this.elements.novelContent;
            if (contentElement.innerHTML.includes('正在加载小说内容')) {
                console.log('检测到内容仍在加载状态，强制更新内容');
                contentElement.innerHTML = formattedContent;
            }
        }, 500);

        // 恢复阅读位置
        setTimeout(() => this.restoreProgress(), 100);
        
        // 增加阅读量（模拟）
        this.incrementViews(novel.id);
        
        // 初始化评论系统
        console.log('准备初始化评论系统，小说ID:', novel.id);
        setTimeout(() => {
            if (typeof initCommentsSystem === 'function') {
                console.log('调用initCommentsSystem函数');
                initCommentsSystem(novel.id);
            } else {
                console.error('initCommentsSystem函数未定义');
            }
        }, 500); // 延迟一下确保DOM完全加载
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
        
        const formattedContent = this.formatContent(sampleContent);
        
        // 使用分页管理器处理内容
        if (this.paginationManager) {
            this.paginationManager.processContent(formattedContent);
        } else {
            // 如果分页管理器不可用，直接显示内容
            this.elements.novelContent.innerHTML = formattedContent;
        }

        setTimeout(() => this.restoreProgress(), 100);
        
        // 初始化评论系统
        console.log('准备初始化评论系统（示例），小说ID:', this.novelId);
        setTimeout(() => {
            if (typeof initCommentsSystem === 'function') {
                console.log('调用initCommentsSystem函数（示例）');
                initCommentsSystem(this.novelId);
            } else {
                console.error('initCommentsSystem函数未定义（示例）');
            }
        }, 500); // 延迟一下确保DOM完全加载
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

        这个夜晚，注定无眠。

        第二天清晨，阳光透过百叶窗的缝隙洒在她的脸上。她几乎一夜未眠，但精神却异常亢奋。

        她花了很长时间挑选衣服，最终选择了一件简单的白色衬衫和米色的长裙，那是他曾经说过最适合她的搭配。

        来到咖啡店时，她看到他已经坐在那个熟悉的位置，那个三年前他们常坐的角落。

        时间仿佛静止了。他依然那么英俊，只是眉宇间多了几分成熟的沧桑。

        "你来了。"他站起身，声音里带着温柔。

        "嗯。"她点点头，心跳如鼓。

        他们相对而坐，空气中弥漫着熟悉的咖啡香味，但彼此之间却隔着三年的时光。

        "你过得怎么样？"他问道，眼中满含关切。

        "还好。"她的回答简短，但内心却波涛汹涌。

        "我听说，你升职了，现在是市场部的总监。"

        她惊讶地看着他："你怎么知道？"

        他苦笑一下："我一直在关注你的消息。这三年来，我从未真正离开过。"

        "那你为什么走？"她的声音有些哽咽。

        "因为我以为，那样对我们都好。我以为时间会让我们忘记彼此，各自寻找更合适的人。"

        "结果呢？"

        "结果我发现，有些人，有些情感，是永远无法忘记的。无论走到哪里，你都在我心里。"

        她的眼泪再次滑落："你知道这三年我是怎么过的吗？每当夜深人静的时候，我都会想起你，想起我们在一起的点点滴滴。"

        "对不起。"他伸手轻抚她的脸颊，"如果可以重来，我绝不会离开你。"

        "可是现在说这些还有什么意义呢？"她推开他的手，"时间不会倒流，我们也回不到从前了。"

        "为什么不能？"他认真地看着她，"只要我们还爱着彼此，就还有机会。"

        "爱？"她苦笑，"三年了，你觉得爱还在吗？"

        "在。"他毫不犹豫地回答，"至少对我来说，从未改变。"

        她沉默了很久，内心在激烈地斗争着。理智告诉她应该忘记过去，但感情却让她想要重新开始。

        "我需要时间考虑。"她最终说道。

        "我等你。"他温柔地说，"无论多久，我都等你。"

        离开咖啡店后，她的心情更加复杂了。原本平静的生活因为他的出现而再次波澜起伏。

        接下来的几天，她陷入了深深的纠结中。一方面，她不愿意再次承受分离的痛苦；另一方面，她又无法否认内心对他的思念。

        就在这时，公司突然派她去国外出差一个月。也许，这是上天给她的一个思考的机会。

        在飞机上，她望着窗外的云海，想起了他们第一次旅行时的情景。那时的他们多么快乐，多么相爱。

        一个月后，她回到了这座城市。心中已经有了答案。

        她再次来到那家咖啡店，他还在那个位置等她。

        "我想过了。"她坐下来，直视着他的眼睛。

        "无论结果如何，我都接受。"他平静地说。

        "我们重新开始吧。"她的声音很轻，但很坚定。

        他的眼中瞬间绽放出光芒："真的吗？"

        "真的。但是，这次我们要慢慢来，重新了解彼此，重新建立信任。"

        "好。"他点头，伸出手握住她的手，"这次，我不会再离开了。"

        后来的日子里，他们确实慢慢来。像初恋一样小心翼翼地呵护着这份重新获得的感情。

        他们一起看电影，一起散步，一起做饭，重新学着如何相爱。

        虽然偶尔还会想起过去的痛苦，但更多的是对未来的憧憬。

        因为他们都明白，真正的爱情值得等待，值得重新开始。

        而有些人，注定要在生命中重逢，无论经历多少分离与重聚。

        这就是他们的故事，一个关于爱情、分离与重逢的故事。`;
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

    // 确保设置面板初始状态是隐藏的
    ensureSettingsPanelHidden() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.classList.remove('active');
        }
        if (this.elements.settingsOverlay) {
            this.elements.settingsOverlay.classList.remove('opacity-100', 'visible');
            this.elements.settingsOverlay.classList.add('opacity-0', 'invisible');
        }
        document.body.style.overflow = '';
    }

    // 改变字体大小
    changeFontSize(delta) {
        const newSize = Math.max(12, Math.min(24, this.settings.fontSize + delta));
        if (newSize === this.settings.fontSize) {
            const message = newSize === 12 ? '字体已经是最小了' : '字体已经是最大了';
            this.showToast(message, 'info');
            return;
        }

        this.settings.fontSize = newSize;

        this.elements.novelContent.style.fontSize = `${newSize}px`;
        this.elements.fontSizeLabel.textContent = `${newSize}px`;

        // 重新应用智能排版
        this.applySmartTypography();

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
            'dark': '夜间模式',
            'paper': '纸质感',
            'green': '护眼绿',
            'blue': '海洋蓝',
            'custom': '自定义主题'
        };
        this.showToast(`已切换到${themeNames[theme]}`);

        // 如果切换到自定义主题，应用自定义颜色
        if (theme === 'custom') {
            this.applyCustomThemeStyles();
        }
    }

    // 打开自定义主题面板
    openCustomThemePanel() {
        this.closeSettings(); // 先关闭设置面板
        this.elements.customThemePanel.classList.add('active');
        this.elements.settingsOverlay.classList.remove('opacity-0', 'invisible');
        this.elements.settingsOverlay.classList.add('opacity-100', 'visible');
        document.body.style.overflow = 'hidden';

        // 初始化颜色选择器的值
        this.initializeCustomThemeControls();
    }

    // 关闭自定义主题面板
    closeCustomThemePanel() {
        this.elements.customThemePanel.classList.remove('active');
        this.elements.settingsOverlay.classList.remove('opacity-100', 'visible');
        this.elements.settingsOverlay.classList.add('opacity-0', 'invisible');
        document.body.style.overflow = '';
    }

    // 初始化自定义主题控件
    initializeCustomThemeControls() {
        const custom = this.settings.customTheme;

        this.elements.bgColorPicker.value = custom.backgroundColor;
        this.elements.bgColorInput.value = custom.backgroundColor;
        this.elements.textColorPicker.value = custom.textColor;
        this.elements.textColorInput.value = custom.textColor;
        this.elements.contentBgColorPicker.value = custom.contentBackgroundColor;
        this.elements.contentBgColorInput.value = custom.contentBackgroundColor;
    }

    // 应用预设颜色方案
    applyPresetColors(preset) {
        const presets = {
            warm: {
                backgroundColor: '#FFF8DC',
                textColor: '#8B4513',
                contentBackgroundColor: '#FFFEF7'
            },
            cool: {
                backgroundColor: '#F0F8FF',
                textColor: '#4682B4',
                contentBackgroundColor: '#FAFCFF'
            },
            vintage: {
                backgroundColor: '#F5F5DC',
                textColor: '#696969',
                contentBackgroundColor: '#FEFEFE'
            },
            forest: {
                backgroundColor: '#F0FFF0',
                textColor: '#228B22',
                contentBackgroundColor: '#FAFFFA'
            },
            sunset: {
                backgroundColor: '#FFE4E1',
                textColor: '#CD5C5C',
                contentBackgroundColor: '#FFF5F5'
            },
            ocean: {
                backgroundColor: '#E0FFFF',
                textColor: '#008B8B',
                contentBackgroundColor: '#F0FFFF'
            }
        };

        const colors = presets[preset];
        if (colors) {
            this.elements.bgColorPicker.value = colors.backgroundColor;
            this.elements.bgColorInput.value = colors.backgroundColor;
            this.elements.textColorPicker.value = colors.textColor;
            this.elements.textColorInput.value = colors.textColor;
            this.elements.contentBgColorPicker.value = colors.contentBackgroundColor;
            this.elements.contentBgColorInput.value = colors.contentBackgroundColor;
        }
    }

    // 应用自定义主题颜色
    applyCustomThemeColors() {
        // 保存自定义颜色到设置
        this.settings.customTheme = {
            backgroundColor: this.elements.bgColorInput.value,
            textColor: this.elements.textColorInput.value,
            contentBackgroundColor: this.elements.contentBgColorInput.value
        };

        // 切换到自定义主题
        this.settings.theme = 'custom';
        document.body.className = 'theme-custom';

        // 更新主题按钮状态
        this.elements.themeButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        // 应用自定义样式
        this.applyCustomThemeStyles();

        // 保存设置
        this.saveSettings();

        // 关闭面板并显示提示
        this.closeCustomThemePanel();
        this.showToast('自定义主题已应用');
    }

    // 应用自定义主题样式
    applyCustomThemeStyles() {
        const custom = this.settings.customTheme;
        const root = document.documentElement;

        // 设置CSS变量
        root.style.setProperty('--custom-bg-color', custom.backgroundColor);
        root.style.setProperty('--custom-text-color', custom.textColor);
        root.style.setProperty('--custom-content-bg-color', custom.contentBackgroundColor);

        // 应用到页面元素
        document.body.style.backgroundColor = custom.backgroundColor;
        document.body.style.color = custom.textColor;

        // 应用到内容区域
        const novelInfo = this.elements.novelInfo;
        const novelContent = this.elements.novelContent;

        if (novelInfo) {
            novelInfo.style.backgroundColor = custom.contentBackgroundColor;
            novelInfo.style.color = custom.textColor;
        }

        if (novelContent) {
            novelContent.style.backgroundColor = custom.contentBackgroundColor;
            novelContent.style.color = custom.textColor;
        }

        // 应用到设置面板
        const settingsPanel = this.elements.settingsPanel;
        if (settingsPanel) {
            settingsPanel.style.backgroundColor = custom.contentBackgroundColor;
            settingsPanel.style.color = custom.textColor;
        }

        // 应用到头部
        const header = document.querySelector('header');
        if (header) {
            header.style.backgroundColor = custom.backgroundColor + 'E6'; // 90% opacity
            header.style.color = custom.textColor;
        }
    }

    // 重置自定义主题颜色
    resetCustomThemeColors() {
        this.elements.bgColorPicker.value = '#FAF5F0';
        this.elements.bgColorInput.value = '#FAF5F0';
        this.elements.textColorPicker.value = '#333333';
        this.elements.textColorInput.value = '#333333';
        this.elements.contentBgColorPicker.value = '#FFFFFF';
        this.elements.contentBgColorInput.value = '#FFFFFF';

        this.showToast('已重置为默认颜色');
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
        
        // 如果有分页，也保存分页信息
        if (this.paginationManager) {
            const paginationInfo = this.paginationManager.getPaginationInfo();
            progress.pagination = {
                currentPage: paginationInfo.currentPage,
                totalPages: paginationInfo.totalPages,
                hasMultiplePages: paginationInfo.hasMultiplePages
            };
        }
        
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

        // 检查内容是否已经是HTML格式
        if (content.trim().startsWith('<p>') || content.trim().startsWith('<div>') || content.includes('<p>')) {
            console.log('内容已经是HTML格式，直接返回');
            // 确保HTML内容有适当的样式类
            return this.enhanceHtmlContent(content);
        }

        // 如果不是HTML格式，则进行格式化
        console.log('内容是纯文本格式，进行格式化');

        // 处理换行符，保留段落结构
        const lines = content.split(/\r?\n/);
        const formattedParagraphs = [];
        let currentParagraph = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === '') {
                // 空行表示段落结束
                if (currentParagraph.trim()) {
                    formattedParagraphs.push(this.formatParagraph(currentParagraph.trim()));
                    currentParagraph = '';
                }
            } else {
                // 非空行，添加到当前段落
                if (currentParagraph) {
                    // 保留换行符，使用<br>标签
                    currentParagraph += '<br>' + line;
                } else {
                    currentParagraph = line;
                }
            }
        }

        // 处理最后一个段落
        if (currentParagraph.trim()) {
            formattedParagraphs.push(this.formatParagraph(currentParagraph.trim()));
        }

        return formattedParagraphs.join('');
    }

    // 格式化单个段落
    formatParagraph(paragraph) {
        // 检查是否是章节标题
        if (paragraph.match(/^第.+章/)) {
            return `<h2 class="chapter-title text-xl font-bold mt-8 mb-6 text-center">${paragraph}</h2>`;
        }

        // 检查是否是其他标题格式
        if (paragraph.match(/^【.+】$/) || paragraph.match(/^\d+\./)) {
            return `<h3 class="section-title text-lg font-semibold mt-6 mb-4">${paragraph}</h3>`;
        }

        // 普通段落，添加适当的间距
        return `<p class="paragraph mb-4 leading-relaxed text-justify">${paragraph}</p>`;
    }

    // 增强HTML内容的样式
    enhanceHtmlContent(htmlContent) {
        // 为HTML内容添加适当的CSS类
        let enhanced = htmlContent;

        // 为段落添加样式类
        enhanced = enhanced.replace(/<p>/g, '<p class="paragraph mb-4 leading-relaxed text-justify">');

        // 为标题添加样式类
        enhanced = enhanced.replace(/<h1>/g, '<h1 class="chapter-title text-2xl font-bold mt-8 mb-6 text-center">');
        enhanced = enhanced.replace(/<h2>/g, '<h2 class="chapter-title text-xl font-bold mt-8 mb-6 text-center">');
        enhanced = enhanced.replace(/<h3>/g, '<h3 class="section-title text-lg font-semibold mt-6 mb-4">');

        // 为引用添加样式
        enhanced = enhanced.replace(/<blockquote>/g, '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-4">');

        return enhanced;
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
                <div class="space-x-4 mt-6">
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

    // 显示权限不足提示
    showAccessDenied(novel) {
        console.log('显示权限不足提示:', novel);

        const membershipText = novel.requiredMembership === 'premium' ? '高级会员' : 'VIP会员';
        const isLoggedIn = !!localStorage.getItem('token');

        this.elements.novelContent.innerHTML = `
            <div class="text-center py-20">
                <div class="text-6xl mb-4">🔒</div>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">需要${membershipText}权限</h2>
                <p class="text-gray-500 mb-6">这是一篇${membershipText}专享内容，需要开通相应会员才能阅读完整内容。</p>

                <div class="max-w-2xl mx-auto mb-8 p-6 bg-gray-50 rounded-lg text-left">
                    <h4 class="font-medium text-gray-800 mb-3">📖 内容预览：</h4>
                    <div class="text-gray-600 text-sm leading-relaxed">
                        ${novel.summary || '暂无预览内容'}
                    </div>
                </div>

                <div class="space-x-4">
                    ${isLoggedIn ? `
                        <button onclick="window.location.href='/membership.html'"
                                class="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg">
                            ✨ 查看${membershipText}套餐
                        </button>
                    ` : `
                        <button onclick="window.location.href='/login.html'"
                                class="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                            🔑 登录账户
                        </button>
                    `}
                    <button onclick="window.history.back()"
                            class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        返回上一页
                    </button>
                </div>

                <div class="mt-6 text-sm text-gray-500">
                    <p>💡 提示：会员开通需要联系管理员处理，我们不支持在线自动开通</p>
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

    // 初始化分页管理器
    initPaginationManager() {
        if (typeof PaginationManager !== 'undefined') {
            this.paginationManager = new PaginationManager(this);
            console.log('分页管理器初始化成功');
        } else {
            console.warn('PaginationManager 未加载，分页功能不可用');
        }
    }

    // 离线管理器已移除

    // 离线功能错误提示已移除

    // 离线状态指示器已移除

    // 离线状态更新已移除
    
    // 离线下载功能已移除
    
    // 切换阅读笔记面板
    toggleNotesPanel() {
        if (!this.readingNotes) {
            this.showToast('阅读笔记功能未加载', 'error');
            return;
        }
        
        // 显示使用提示
        this.showToast('选择文本后右键或使用快捷键：Ctrl+H高亮、Ctrl+U下划线、Ctrl+N添加笔记', 'info');
        
        // 如果有现有笔记，显示笔记摘要
        const notesSummary = this.readingNotes.getNotesSummary();
        if (notesSummary.total > 0) {
            this.showToast(`当前共有 ${notesSummary.total} 个笔记：${notesSummary.highlights}个高亮，${notesSummary.underlines}个下划线，${notesSummary.textNotes}个文字笔记`, 'info');
        }
    }

    // 切换全文搜索面板
    toggleSearchPanel() {
        // 初始化搜索功能（如果尚未初始化）
        if (!this.fullTextSearch && typeof FullTextSearch !== 'undefined') {
            const contentElement = document.getElementById('novelContent');
            if (contentElement) {
                this.fullTextSearch = new FullTextSearch(contentElement);
            }
        }
        
        if (!this.fullTextSearch) {
            this.showToast('全文搜索功能未加载', 'error');
            return;
        }
        
        // 显示搜索面板
        this.fullTextSearch.show();
    }

    // 切换TTS语音朗读
    toggleTTSReading() {
        if (!this.ttsReader) {
            this.showToast('语音朗读功能未加载', 'error');
            return;
        }

        if (!this.ttsReader.isSupported()) {
            this.showToast('您的浏览器不支持语音朗读功能', 'error');
            return;
        }

        if (this.ttsReader.isReading) {
            if (this.ttsReader.isPaused) {
                // 继续朗读
                this.ttsReader.resume();
                this.showToast('继续朗读', 'info');
            } else {
                // 暂停朗读
                this.ttsReader.pause();
                this.showToast('已暂停', 'info');
            }
        } else {
            // 开始朗读
            const contentElement = document.getElementById('novelContent');
            if (contentElement) {
                const textContent = contentElement.textContent;
                if (textContent && textContent.trim()) {
                    this.ttsReader.speak(textContent);
                    this.showToast('开始朗读', 'info');
                } else {
                    this.showToast('没有可朗读的内容', 'error');
                }
            }
        }
    }

    // 打开阅读统计面板
    openAnalyticsPanel() {
        if (!this.readingAnalytics) {
            this.showToast('阅读统计功能未加载', 'error');
            return;
        }

        // 生成阅读报告
        const report = this.readingAnalytics.generateReadingReport();
        
        // 创建统计面板
        this.createAnalyticsModal(report);
    }

    // 创建阅读统计模态框
    createAnalyticsModal(report) {
        // 移除现有模态框
        const existingModal = document.getElementById('analyticsModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'analyticsModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-80vh overflow-y-auto';
        
        modalContent.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold">阅读统计</h3>
                <button id="closeAnalytics" class="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            
            <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-blue-800 mb-2">本次阅读</h4>
                    <div class="text-sm text-blue-600 space-y-1">
                        <p>阅读时长: ${Math.round(report.currentSession.duration)} 分钟</p>
                        <p>已读字数: ${report.currentSession.wordsRead} 字</p>
                        <p>阅读速度: ${report.currentSession.readingSpeed} 字/分钟</p>
                        <p>专注时间: ${Math.round(report.currentSession.activeTime)} 分钟</p>
                    </div>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-green-800 mb-2">累计统计</h4>
                    <div class="text-sm text-green-600 space-y-1">
                        <p>总阅读时长: ${Math.round(report.cumulative.totalReadingTime)} 分钟</p>
                        <p>总阅读字数: ${report.cumulative.totalWordsRead} 字</p>
                        <p>平均阅读速度: ${report.cumulative.avgReadingSpeed} 字/分钟</p>
                        <p>阅读会话: ${report.cumulative.sessionCount} 次</p>
                    </div>
                </div>
                
                ${Object.keys(report.dailyStats).length > 0 ? `
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-purple-800 mb-2">最近阅读记录</h4>
                    <div class="text-sm text-purple-600 space-y-1 max-h-24 overflow-y-auto">
                        ${Object.entries(report.dailyStats)
                            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                            .slice(0, 5)
                            .map(([date, stats]) => `
                                <p>${new Date(date).toLocaleDateString()}: ${Math.round(stats.readingTime)} 分钟, ${stats.wordsRead} 字</p>
                            `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // 绑定关闭事件
        document.getElementById('closeAnalytics').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// 页面加载完成后初始化阅读器
document.addEventListener('DOMContentLoaded', () => {
    new NovelReader();
});