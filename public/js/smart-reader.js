// 智能阅读器增强功能模块
// 阅读数据分析系统
class ReadingAnalytics {
    constructor(novelId, token = null) {
        this.novelId = novelId;
        this.token = token;
        this.sessionData = {
            startTime: Date.now(),
            endTime: null,
            wordsRead: 0,
            readingSpeed: 0,
            scrollPositions: [],
            interactionEvents: [],
            activeReadingTime: 0, // 实际活跃阅读时间
            pauseTime: 0 // 暂停时间
        };
        
        this.isActive = true;
        this.lastScrollTime = Date.now();
        this.lastScrollPosition = 0;
        this.inactivityTimer = null;
        this.inactivityThreshold = 30000; // 30秒无操作视为暂停
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.startSession();
    }

    bindEvents() {
        // 滚动事件监听
        let scrollTimer;
        window.addEventListener('scroll', (e) => {
            const now = Date.now();
            const scrollY = window.scrollY;
            
            // 记录滚动位置
            this.sessionData.scrollPositions.push({
                position: scrollY,
                timestamp: now
            });
            
            // 计算阅读进度
            this.updateReadingProgress(scrollY);
            
            // 重置活跃状态
            this.resetInactivityTimer();
            
            // 防抖保存数据
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => this.saveSessionData(), 1000);
            
            this.lastScrollTime = now;
            this.lastScrollPosition = scrollY;
        }, { passive: true });

        // 鼠标/触摸活动监听
        ['mousedown', 'mousemove', 'keydown', 'touchstart', 'touchmove'].forEach(event => {
            document.addEventListener(event, () => {
                this.recordInteractionEvent(event);
                this.resetInactivityTimer();
            }, { passive: true });
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseSession();
            } else {
                this.resumeSession();
            }
        });

        // 页面卸载时保存数据
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
    }

    startSession() {
        this.sessionData.startTime = Date.now();
        this.isActive = true;
        this.resetInactivityTimer();
        console.log('阅读会话开始');
    }

    pauseSession() {
        if (this.isActive) {
            this.isActive = false;
            const pauseStart = Date.now();
            this.sessionData.interactionEvents.push({
                type: 'pause',
                timestamp: pauseStart
            });
            console.log('阅读会话暂停');
        }
    }

    resumeSession() {
        if (!this.isActive) {
            this.isActive = true;
            const resumeTime = Date.now();
            this.sessionData.interactionEvents.push({
                type: 'resume',
                timestamp: resumeTime
            });
            this.resetInactivityTimer();
            console.log('阅读会话恢复');
        }
    }

    endSession() {
        this.sessionData.endTime = Date.now();
        this.calculateFinalStats();
        this.saveSessionData();
        console.log('阅读会话结束，总时长:', this.getSessionDuration(), '分钟');
    }

    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        this.inactivityTimer = setTimeout(() => {
            this.pauseSession();
        }, this.inactivityThreshold);
    }

    recordInteractionEvent(eventType) {
        this.sessionData.interactionEvents.push({
            type: eventType,
            timestamp: Date.now(),
            position: window.scrollY
        });
    }

    updateReadingProgress(scrollY) {
        // 估算已读文字数
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = documentHeight > 0 ? scrollY / documentHeight : 0;
        
        // 获取当前页面文字总数（估算）
        const contentElement = document.getElementById('novelContent');
        if (contentElement) {
            const totalWords = this.estimateWordCount(contentElement.textContent);
            this.sessionData.wordsRead = Math.floor(totalWords * scrollPercentage);
        }
    }

    estimateWordCount(text) {
        if (!text) return 0;
        // 中文按字符计算，英文按单词计算
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
        return chineseChars + englishWords;
    }

    calculateFinalStats() {
        const sessionDuration = this.getSessionDuration(); // 分钟
        const wordsRead = this.sessionData.wordsRead;
        
        // 计算活跃阅读时间（排除暂停时间）
        const activeTime = this.calculateActiveReadingTime();
        
        // 计算阅读速度（字/分钟）
        this.sessionData.readingSpeed = activeTime > 0 ? Math.round(wordsRead / activeTime) : 0;
        this.sessionData.activeReadingTime = activeTime;
    }

    calculateActiveReadingTime() {
        let activeTime = 0;
        let lastActiveTime = this.sessionData.startTime;
        let isPaused = false;
        
        this.sessionData.interactionEvents.forEach(event => {
            if (event.type === 'pause') {
                if (!isPaused) {
                    activeTime += event.timestamp - lastActiveTime;
                    isPaused = true;
                }
            } else if (event.type === 'resume') {
                if (isPaused) {
                    lastActiveTime = event.timestamp;
                    isPaused = false;
                }
            }
        });
        
        // 如果最后没有暂停，加上最后一段时间
        if (!isPaused) {
            activeTime += (this.sessionData.endTime || Date.now()) - lastActiveTime;
        }
        
        return Math.max(0, activeTime / 60000); // 转换为分钟
    }

    getSessionDuration() {
        const endTime = this.sessionData.endTime || Date.now();
        return (endTime - this.sessionData.startTime) / 60000; // 分钟
    }

    saveSessionData() {
        const sessionKey = `reading-session-${this.novelId}-${this.sessionData.startTime}`;
        localStorage.setItem(sessionKey, JSON.stringify(this.sessionData));
        
        // 更新累计统计数据
        this.updateCumulativeStats();
    }

    updateCumulativeStats() {
        const statsKey = `reading-analytics-${this.novelId}`;
        const existingStats = JSON.parse(localStorage.getItem(statsKey) || '{}');
        
        const today = new Date().toDateString();
        const sessionDuration = this.getSessionDuration();
        const wordsRead = this.sessionData.wordsRead;
        const readingSpeed = this.sessionData.readingSpeed;
        
        // 更新统计数据
        existingStats.totalReadingTime = (existingStats.totalReadingTime || 0) + sessionDuration;
        existingStats.totalWordsRead = (existingStats.totalWordsRead || 0) + wordsRead;
        existingStats.sessionCount = (existingStats.sessionCount || 0) + 1;
        
        // 更新平均阅读速度
        existingStats.avgReadingSpeed = existingStats.totalWordsRead > 0 ? 
            Math.round(existingStats.totalWordsRead / existingStats.totalReadingTime) : 0;
        
        // 更新每日统计
        if (!existingStats.dailyStats) existingStats.dailyStats = {};
        if (!existingStats.dailyStats[today]) {
            existingStats.dailyStats[today] = {
                readingTime: 0,
                wordsRead: 0,
                sessions: 0
            };
        }
        
        existingStats.dailyStats[today].readingTime += sessionDuration;
        existingStats.dailyStats[today].wordsRead += wordsRead;
        existingStats.dailyStats[today].sessions += 1;
        
        // 记录阅读时间偏好（小时）
        const hour = new Date().getHours();
        if (!existingStats.readingTimePreferences) {
            existingStats.readingTimePreferences = {};
        }
        existingStats.readingTimePreferences[hour] = (existingStats.readingTimePreferences[hour] || 0) + sessionDuration;
        
        localStorage.setItem(statsKey, JSON.stringify(existingStats));
    }

    getAnalyticsData() {
        const statsKey = `reading-analytics-${this.novelId}`;
        return JSON.parse(localStorage.getItem(statsKey) || '{}');
    }

    generateReadingReport() {
        const analytics = this.getAnalyticsData();
        const currentSession = this.sessionData;
        
        return {
            currentSession: {
                duration: this.getSessionDuration(),
                wordsRead: currentSession.wordsRead,
                readingSpeed: currentSession.readingSpeed,
                activeTime: this.calculateActiveReadingTime()
            },
            cumulative: {
                totalReadingTime: analytics.totalReadingTime || 0,
                totalWordsRead: analytics.totalWordsRead || 0,
                avgReadingSpeed: analytics.avgReadingSpeed || 0,
                sessionCount: analytics.sessionCount || 0
            },
            dailyStats: analytics.dailyStats || {},
            readingTimePreferences: analytics.readingTimePreferences || {}
        };
    }
}

// TTS语音朗读系统
class TTSReader {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.isReading = false;
        this.isPaused = false;
        this.rate = 1.0; // 语速
        this.pitch = 1.0; // 音调
        this.volume = 1.0; // 音量
        this.voice = null; // 选中的声音
        this.availableVoices = [];
        this.currentPosition = 0; // 当前朗读位置
        
        this.init();
    }

    init() {
        this.loadVoices();
        
        // 监听声音加载完成
        if (this.synthesis.addEventListener) {
            this.synthesis.addEventListener('voiceschanged', () => {
                this.loadVoices();
            });
        }
    }

    loadVoices() {
        this.availableVoices = this.synthesis.getVoices().filter(voice => 
            voice.lang.includes('zh') || voice.lang.includes('en')
        );
        
        // 优先选择中文声音
        this.voice = this.availableVoices.find(voice => 
            voice.lang.includes('zh-CN') || voice.lang.includes('zh')
        ) || this.availableVoices[0];
    }

    speak(text, options = {}) {
        if (!text || !this.synthesis) return;

        // 停止当前朗读
        this.stop();

        // 文本预处理
        const processedText = this.preprocessText(text);
        
        this.currentUtterance = new SpeechSynthesisUtterance(processedText);
        
        // 设置语音参数
        this.currentUtterance.rate = options.rate || this.rate;
        this.currentUtterance.pitch = options.pitch || this.pitch;
        this.currentUtterance.volume = options.volume || this.volume;
        this.currentUtterance.voice = options.voice || this.voice;

        // 设置事件监听
        this.currentUtterance.onstart = () => {
            this.isReading = true;
            this.isPaused = false;
            this.onReadingStart && this.onReadingStart();
        };

        this.currentUtterance.onend = () => {
            this.isReading = false;
            this.isPaused = false;
            this.onReadingEnd && this.onReadingEnd();
        };

        this.currentUtterance.onerror = (event) => {
            console.error('TTS错误:', event.error);
            this.isReading = false;
            this.isPaused = false;
            this.onReadingError && this.onReadingError(event.error);
        };

        this.currentUtterance.onpause = () => {
            this.isPaused = true;
            this.onReadingPause && this.onReadingPause();
        };

        this.currentUtterance.onresume = () => {
            this.isPaused = false;
            this.onReadingResume && this.onReadingResume();
        };

        // 开始朗读
        this.synthesis.speak(this.currentUtterance);
    }

    preprocessText(text) {
        // 移除HTML标签
        text = text.replace(/<[^>]*>/g, '');
        
        // 替换特殊字符
        text = text.replace(/&nbsp;/g, ' ');
        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&gt;/g, '>');
        
        // 添加适当的停顿
        text = text.replace(/[。！？]/g, '$&，'); // 句号后添加短停顿
        text = text.replace(/[，；]/g, '$&'); // 逗号分号保持原样
        
        return text;
    }

    pause() {
        if (this.isReading && !this.isPaused) {
            this.synthesis.pause();
        }
    }

    resume() {
        if (this.isReading && this.isPaused) {
            this.synthesis.resume();
        }
    }

    stop() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        this.isReading = false;
        this.isPaused = false;
    }

    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(2.0, rate));
        if (this.currentUtterance) {
            this.currentUtterance.rate = this.rate;
        }
    }

    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2, pitch));
        if (this.currentUtterance) {
            this.currentUtterance.pitch = this.pitch;
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentUtterance) {
            this.currentUtterance.volume = this.volume;
        }
    }

    setVoice(voiceIndex) {
        if (voiceIndex >= 0 && voiceIndex < this.availableVoices.length) {
            this.voice = this.availableVoices[voiceIndex];
        }
    }

    getAvailableVoices() {
        return this.availableVoices.map((voice, index) => ({
            index,
            name: voice.name,
            lang: voice.lang,
            localService: voice.localService
        }));
    }

    isSupported() {
        return 'speechSynthesis' in window;
    }
}

// 阅读笔记系统
class ReadingNotes {
    constructor(novelId) {
        this.novelId = novelId;
        this.notes = this.loadNotes();
        this.selectedText = '';
        this.selectedRange = null;
        this.noteColors = {
            yellow: '#FFE066',
            green: '#98FB98',
            blue: '#87CEEB',
            pink: '#FFB6C1',
            orange: '#FFA500'
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderExistingNotes();
    }

    bindEvents() {
        // 文本选择事件
        document.addEventListener('mouseup', (e) => {
            setTimeout(() => this.handleTextSelection(e), 10);
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'h':
                        e.preventDefault();
                        this.highlightSelectedText('yellow');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.underlineSelectedText();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.addNoteToSelection();
                        break;
                }
            }
        });
    }

    handleTextSelection(e) {
        const selection = window.getSelection();
        
        if (selection.rangeCount === 0 || selection.isCollapsed) {
            this.hideNoteMenu();
            return;
        }

        this.selectedText = selection.toString().trim();
        if (this.selectedText.length === 0) {
            this.hideNoteMenu();
            return;
        }

        this.selectedRange = selection.getRangeAt(0).cloneRange();
        this.showNoteMenu(e.clientX, e.clientY);
    }

    showNoteMenu(x, y) {
        // 移除现有菜单
        this.hideNoteMenu();

        const menu = document.createElement('div');
        menu.id = 'noteMenu';
        menu.className = 'note-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            gap: 8px;
            align-items: center;
        `;

        // 高亮颜色选项
        Object.entries(this.noteColors).forEach(([colorName, colorValue]) => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'note-color-btn';
            colorBtn.style.cssText = `
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid #ddd;
                background: ${colorValue};
                cursor: pointer;
                margin: 0 2px;
            `;
            colorBtn.title = `高亮 (${colorName})`;
            colorBtn.onclick = () => {
                this.highlightSelectedText(colorName);
                this.hideNoteMenu();
            };
            menu.appendChild(colorBtn);
        });

        // 下划线按钮
        const underlineBtn = document.createElement('button');
        underlineBtn.innerHTML = 'U';
        underlineBtn.className = 'note-action-btn';
        underlineBtn.style.cssText = `
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            cursor: pointer;
            text-decoration: underline;
            font-weight: bold;
        `;
        underlineBtn.title = '下划线';
        underlineBtn.onclick = () => {
            this.underlineSelectedText();
            this.hideNoteMenu();
        };

        // 添加笔记按钮
        const noteBtn = document.createElement('button');
        noteBtn.innerHTML = '📝';
        noteBtn.className = 'note-action-btn';
        noteBtn.style.cssText = `
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            cursor: pointer;
        `;
        noteBtn.title = '添加笔记';
        noteBtn.onclick = () => {
            this.addNoteToSelection();
            this.hideNoteMenu();
        };

        menu.appendChild(underlineBtn);
        menu.appendChild(noteBtn);
        
        document.body.appendChild(menu);

        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', this.hideNoteMenu.bind(this), { once: true });
        }, 10);
    }

    hideNoteMenu() {
        const menu = document.getElementById('noteMenu');
        if (menu) {
            menu.remove();
        }
    }

    highlightSelectedText(color) {
        if (!this.selectedRange || !this.selectedText) return;

        const noteId = this.generateNoteId();
        const position = this.getTextPosition(this.selectedRange);
        
        // 创建高亮元素
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'reading-highlight';
        highlightSpan.dataset.noteId = noteId;
        highlightSpan.style.cssText = `
            background-color: ${this.noteColors[color]};
            padding: 1px 2px;
            border-radius: 3px;
            cursor: pointer;
        `;

        try {
            this.selectedRange.surroundContents(highlightSpan);
        } catch (e) {
            // 如果范围跨越多个元素，使用另一种方法
            const contents = this.selectedRange.extractContents();
            highlightSpan.appendChild(contents);
            this.selectedRange.insertNode(highlightSpan);
        }

        // 保存笔记数据
        const note = {
            id: noteId,
            type: 'highlight',
            text: this.selectedText,
            color: color,
            position: position,
            timestamp: Date.now()
        };

        this.notes.push(note);
        this.saveNotes();

        // 绑定点击事件
        highlightSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNoteDetails(noteId);
        });

        // 清除选择
        window.getSelection().removeAllRanges();
    }

    underlineSelectedText() {
        if (!this.selectedRange || !this.selectedText) return;

        const noteId = this.generateNoteId();
        const position = this.getTextPosition(this.selectedRange);
        
        // 创建下划线元素
        const underlineSpan = document.createElement('span');
        underlineSpan.className = 'reading-underline';
        underlineSpan.dataset.noteId = noteId;
        underlineSpan.style.cssText = `
            text-decoration: underline;
            text-decoration-color: #FE2C55;
            text-decoration-thickness: 2px;
            cursor: pointer;
        `;

        try {
            this.selectedRange.surroundContents(underlineSpan);
        } catch (e) {
            const contents = this.selectedRange.extractContents();
            underlineSpan.appendChild(contents);
            this.selectedRange.insertNode(underlineSpan);
        }

        // 保存笔记数据
        const note = {
            id: noteId,
            type: 'underline',
            text: this.selectedText,
            position: position,
            timestamp: Date.now()
        };

        this.notes.push(note);
        this.saveNotes();

        // 绑定点击事件
        underlineSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNoteDetails(noteId);
        });

        // 清除选择
        window.getSelection().removeAllRanges();
    }

    addNoteToSelection() {
        if (!this.selectedText) return;

        const noteText = prompt('请输入笔记内容:', '');
        if (!noteText) return;

        const noteId = this.generateNoteId();
        const position = this.getTextPosition(this.selectedRange);
        
        // 创建笔记标记
        const noteSpan = document.createElement('span');
        noteSpan.className = 'reading-note';
        noteSpan.dataset.noteId = noteId;
        noteSpan.style.cssText = `
            background-color: #FFF59D;
            border-left: 3px solid #FE2C55;
            padding: 1px 4px;
            margin: 0 2px;
            border-radius: 3px;
            cursor: pointer;
            position: relative;
        `;

        try {
            this.selectedRange.surroundContents(noteSpan);
        } catch (e) {
            const contents = this.selectedRange.extractContents();
            noteSpan.appendChild(contents);
            this.selectedRange.insertNode(noteSpan);
        }

        // 添加笔记图标
        const noteIcon = document.createElement('sup');
        noteIcon.innerHTML = '📝';
        noteIcon.style.cssText = `
            font-size: 12px;
            margin-left: 2px;
            color: #FE2C55;
        `;
        noteSpan.appendChild(noteIcon);

        // 保存笔记数据
        const note = {
            id: noteId,
            type: 'note',
            text: this.selectedText,
            content: noteText,
            position: position,
            timestamp: Date.now()
        };

        this.notes.push(note);
        this.saveNotes();

        // 绑定点击事件
        noteSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNoteDetails(noteId);
        });

        // 清除选择
        window.getSelection().removeAllRanges();
    }

    showNoteDetails(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        // 创建笔记详情弹窗
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; color: #333;">笔记详情</h3>
                <button id="closeNoteModal" style="border: none; background: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 12px; color: #666; margin-bottom: 8px;">类型: ${this.getNoteTypeText(note.type)}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 8px;">时间: ${new Date(note.timestamp).toLocaleString()}</div>
                <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                    "${note.text}"
                </div>
                ${note.content ? `
                    <div style="margin-top: 12px;">
                        <div style="font-size: 14px; color: #333; margin-bottom: 8px;">笔记内容:</div>
                        <div style="background: #fff9c4; padding: 12px; border-radius: 8px; border-left: 3px solid #FE2C55;">
                            ${note.content}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="editNote" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer;">编辑</button>
                <button id="deleteNote" style="padding: 8px 16px; border: none; border-radius: 6px; background: #ff4757; color: white; cursor: pointer;">删除</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // 绑定事件
        document.getElementById('closeNoteModal').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        document.getElementById('editNote').onclick = () => {
            this.editNote(noteId);
            modal.remove();
        };
        
        document.getElementById('deleteNote').onclick = () => {
            this.deleteNote(noteId);
            modal.remove();
        };
    }

    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note || note.type !== 'note') return;

        const newContent = prompt('编辑笔记内容:', note.content);
        if (newContent !== null) {
            note.content = newContent;
            note.timestamp = Date.now(); // 更新时间戳
            this.saveNotes();
        }
    }

    deleteNote(noteId) {
        if (!confirm('确定删除这个笔记吗？')) return;

        // 移除DOM元素
        const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
        if (noteElement) {
            const parent = noteElement.parentNode;
            while (noteElement.firstChild) {
                parent.insertBefore(noteElement.firstChild, noteElement);
            }
            noteElement.remove();
        }

        // 从数组中移除
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.saveNotes();
    }

    generateNoteId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getTextPosition(range) {
        // 简化的位置计算，实际项目中可能需要更精确的算法
        const container = document.getElementById('novelContent');
        if (!container) return { offset: 0 };

        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(container);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        
        return {
            offset: preCaretRange.toString().length,
            text: range.toString()
        };
    }

    getNoteTypeText(type) {
        const types = {
            'highlight': '高亮',
            'underline': '下划线',
            'note': '文字笔记'
        };
        return types[type] || type;
    }

    renderExistingNotes() {
        // 这里应该根据保存的位置信息重新渲染笔记
        // 由于位置计算的复杂性，这里只做基础实现
        console.log('已加载笔记数量:', this.notes.length);
    }

    loadNotes() {
        const notesKey = `reading-notes-${this.novelId}`;
        const saved = localStorage.getItem(notesKey);
        return saved ? JSON.parse(saved) : [];
    }

    saveNotes() {
        const notesKey = `reading-notes-${this.novelId}`;
        localStorage.setItem(notesKey, JSON.stringify(this.notes));
    }

    exportNotes() {
        const exportData = {
            novelId: this.novelId,
            exportTime: new Date().toISOString(),
            notes: this.notes
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `reading-notes-${this.novelId}-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    getNotesSummary() {
        const summary = {
            total: this.notes.length,
            highlights: this.notes.filter(n => n.type === 'highlight').length,
            underlines: this.notes.filter(n => n.type === 'underline').length,
            textNotes: this.notes.filter(n => n.type === 'note').length
        };
        
        return summary;
    }
}

// 全文搜索引擎
class FullTextSearch {
    constructor(contentElement) {
        this.contentElement = contentElement;
        this.searchResults = [];
        this.currentResultIndex = -1;
        this.searchHighlightClass = 'search-highlight';
        this.currentHighlightClass = 'search-current';
        
        this.init();
    }

    init() {
        this.createSearchUI();
        this.addSearchStyles();
    }

    createSearchUI() {
        // 创建搜索框
        const searchContainer = document.createElement('div');
        searchContainer.id = 'fullTextSearch';
        searchContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1500;
            min-width: 300px;
            display: none;
        `;

        searchContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <input type="text" id="searchInput" placeholder="搜索内容..." 
                       style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; outline: none;">
                <button id="searchBtn" style="padding: 8px 12px; background: #FE2C55; color: white; border: none; border-radius: 6px; cursor: pointer;">搜索</button>
                <button id="closeSearch" style="padding: 8px; background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
            </div>
            <div id="searchInfo" style="font-size: 12px; color: #666; margin-bottom: 8px; display: none;">
                找到 <span id="resultCount">0</span> 个结果
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="prevResult" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;" disabled>上一个</button>
                <button id="nextResult" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;" disabled>下一个</button>
                <button id="clearSearch" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">清除</button>
            </div>
        `;

        document.body.appendChild(searchContainer);

        // 绑定事件
        this.bindSearchEvents();
    }

    bindSearchEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const closeSearch = document.getElementById('closeSearch');
        const prevResult = document.getElementById('prevResult');
        const nextResult = document.getElementById('nextResult');
        const clearSearch = document.getElementById('clearSearch');

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value);
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });

        searchBtn.addEventListener('click', () => {
            this.performSearch(searchInput.value);
        });

        closeSearch.addEventListener('click', () => {
            this.hide();
        });

        prevResult.addEventListener('click', () => {
            this.navigateResults(-1);
        });

        nextResult.addEventListener('click', () => {
            this.navigateResults(1);
        });

        clearSearch.addEventListener('click', () => {
            this.clearHighlights();
            searchInput.value = '';
            this.updateSearchInfo(0);
        });

        // 全局快捷键
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.show();
            }
        });
    }

    addSearchStyles() {
        if (document.getElementById('searchStyles')) return;

        const style = document.createElement('style');
        style.id = 'searchStyles';
        style.textContent = `
            .${this.searchHighlightClass} {
                background-color: #FFEB3B !important;
                color: #333 !important;
                padding: 1px 2px;
                border-radius: 2px;
            }
            
            .${this.currentHighlightClass} {
                background-color: #FF5722 !important;
                color: white !important;
                padding: 1px 2px;
                border-radius: 2px;
                box-shadow: 0 0 3px rgba(255, 87, 34, 0.5);
            }
        `;
        document.head.appendChild(style);
    }

    show() {
        const searchContainer = document.getElementById('fullTextSearch');
        if (searchContainer) {
            searchContainer.style.display = 'block';
            document.getElementById('searchInput').focus();
        }
    }

    hide() {
        const searchContainer = document.getElementById('fullTextSearch');
        if (searchContainer) {
            searchContainer.style.display = 'none';
        }
        this.clearHighlights();
    }

    performSearch(query) {
        if (!query || query.trim().length === 0) {
            this.clearHighlights();
            return;
        }

        query = query.trim();
        this.clearHighlights();

        // 获取文本内容
        const content = this.contentElement.textContent;
        const regex = new RegExp(this.escapeRegExp(query), 'gi');
        
        // 查找所有匹配
        let matches = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            matches.push({
                index: match.index,
                text: match[0],
                length: match[0].length
            });
        }

        if (matches.length === 0) {
            this.updateSearchInfo(0);
            return;
        }

        // 高亮显示结果
        this.highlightMatches(query);
        this.searchResults = Array.from(this.contentElement.querySelectorAll(`.${this.searchHighlightClass}`));
        this.currentResultIndex = 0;
        
        this.updateSearchInfo(this.searchResults.length);
        this.scrollToResult(0);
        this.updateNavigationButtons();
    }

    highlightMatches(query) {
        const walker = document.createTreeWalker(
            this.contentElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const nodes = [];
        let node;
        while (node = walker.nextNode()) {
            nodes.push(node);
        }

        nodes.forEach(textNode => {
            const text = textNode.textContent;
            const regex = new RegExp(this.escapeRegExp(query), 'gi');
            
            if (regex.test(text)) {
                const highlightedHTML = text.replace(regex, (match) => {
                    return `<span class="${this.searchHighlightClass}">${match}</span>`;
                });

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = highlightedHTML;
                
                const parent = textNode.parentNode;
                const fragment = document.createDocumentFragment();
                
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                
                parent.replaceChild(fragment, textNode);
            }
        });
    }

    navigateResults(direction) {
        if (this.searchResults.length === 0) return;

        // 移除当前高亮
        if (this.currentResultIndex >= 0) {
            this.searchResults[this.currentResultIndex].classList.remove(this.currentHighlightClass);
        }

        // 计算新索引
        this.currentResultIndex += direction;
        if (this.currentResultIndex >= this.searchResults.length) {
            this.currentResultIndex = 0;
        } else if (this.currentResultIndex < 0) {
            this.currentResultIndex = this.searchResults.length - 1;
        }

        this.scrollToResult(this.currentResultIndex);
        this.updateNavigationButtons();
    }

    scrollToResult(index) {
        if (index < 0 || index >= this.searchResults.length) return;

        const result = this.searchResults[index];
        result.classList.add(this.currentHighlightClass);
        
        // 滚动到结果位置
        result.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        // 更新当前结果显示
        const searchInfo = document.getElementById('searchInfo');
        if (searchInfo) {
            searchInfo.innerHTML = `找到 <span id="resultCount">${this.searchResults.length}</span> 个结果，当前第 ${index + 1} 个`;
        }
    }

    clearHighlights() {
        // 移除所有高亮
        const highlights = this.contentElement.querySelectorAll(`.${this.searchHighlightClass}, .${this.currentHighlightClass}`);
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        });

        // 合并相邻的文本节点
        this.contentElement.normalize();

        this.searchResults = [];
        this.currentResultIndex = -1;
        this.updateNavigationButtons();
    }

    updateSearchInfo(count) {
        const searchInfo = document.getElementById('searchInfo');
        const resultCount = document.getElementById('resultCount');
        
        if (count > 0) {
            searchInfo.style.display = 'block';
            resultCount.textContent = count;
        } else {
            searchInfo.style.display = 'none';
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevResult');
        const nextBtn = document.getElementById('nextResult');
        const hasResults = this.searchResults.length > 0;
        
        prevBtn.disabled = !hasResults;
        nextBtn.disabled = !hasResults;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ReadingAnalytics,
        TTSReader,
        ReadingNotes,
        FullTextSearch
    };
} else {
    // 浏览器环境，添加到全局对象
    window.ReadingAnalytics = ReadingAnalytics;
    window.TTSReader = TTSReader;
    window.ReadingNotes = ReadingNotes;
    window.FullTextSearch = FullTextSearch;
}