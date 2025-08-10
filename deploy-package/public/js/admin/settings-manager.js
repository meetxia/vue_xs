/**
 * 系统设置管理器
 * 负责管理网站的系统设置功能
 */
class SettingsManager {
    constructor() {
        this.currentSettings = {};
        this.currentTab = 'website';
        this.isLoading = false;
        this.init();
    }

    /**
     * 初始化设置管理器
     */
    init() {
        console.log('初始化系统设置管理器...');
        this.loadSettings();
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听设置页面激活
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'settings') {
                this.loadSettings();
            }
        });
    }

    /**
     * 加载系统设置
     */
    async loadSettings() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentSettings = result.data;
                this.populateSettingsForm();
                console.log('系统设置加载成功');
            } else {
                this.showError('加载设置失败: ' + result.message);
            }
        } catch (error) {
            console.error('加载系统设置失败:', error);
            this.showError('加载设置失败，请检查网络连接');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 填充设置表单
     */
    populateSettingsForm() {
        const settings = this.currentSettings;
        
        // 网站信息
        if (settings.website) {
            this.setInputValue('websiteName', settings.website.name);
            this.setInputValue('websiteDescription', settings.website.description);
            this.setInputValue('websiteKeywords', settings.website.keywords);
        }
        
        // 联系方式
        if (settings.contact) {
            this.setInputValue('contactWechat', settings.contact.wechat);
            this.setInputValue('contactEmail', settings.contact.email);
            this.setInputValue('contactQQ', settings.contact.qq);
            this.setInputValue('contactPhone', settings.contact.phone);
            this.setInputValue('workingHours', settings.contact.workingHours);
            this.setInputValue('contactAddress', settings.contact.address);
            this.setInputValue('supportNote', settings.contact.supportNote);
        }
        
        // 管理员信息
        if (settings.admin) {
            this.setInputValue('adminName', settings.admin.name);
            this.setInputValue('adminEmail', settings.admin.email);
            this.setInputValue('adminBio', settings.admin.bio);
        }
        
        // 会员设置
        if (settings.membership) {
            this.setCheckboxValue('enableMembership', settings.membership.enableMembership);
            
            if (settings.membership.premiumPrice) {
                this.setInputValue('premiumMonthly', settings.membership.premiumPrice.monthly);
                this.setInputValue('premiumQuarterly', settings.membership.premiumPrice.quarterly);
                this.setInputValue('premiumYearly', settings.membership.premiumPrice.yearly);
            }
            
            if (settings.membership.vipPrice) {
                this.setInputValue('vipMonthly', settings.membership.vipPrice.monthly);
                this.setInputValue('vipQuarterly', settings.membership.vipPrice.quarterly);
                this.setInputValue('vipYearly', settings.membership.vipPrice.yearly);
            }
        }
    }

    /**
     * 设置输入框值
     */
    setInputValue(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    }

    /**
     * 设置复选框值
     */
    setCheckboxValue(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.checked = Boolean(value);
        }
    }

    /**
     * 获取输入框值
     */
    getInputValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    }

    /**
     * 获取复选框值
     */
    getCheckboxValue(id) {
        const element = document.getElementById(id);
        return element ? element.checked : false;
    }

    /**
     * 准备完整的设置数据
     */
    prepareFullSettings() {
        // 从当前表单获取所有数据
        const websiteData = {
            name: this.getInputValue('websiteName') || this.currentSettings.website?.name || 'MOMO炒饭店',
            description: this.getInputValue('websiteDescription') || this.currentSettings.website?.description || '小红书风格个人小说发布网站',
            keywords: this.getInputValue('websiteKeywords') || this.currentSettings.website?.keywords || '小说,阅读,小红书,文学,创作'
        };

        const contactData = {
            wechat: this.getInputValue('contactWechat') || this.currentSettings.contact?.wechat || 'novel-service',
            email: this.getInputValue('contactEmail') || this.currentSettings.contact?.email || 'service@novel-site.com',
            qq: this.getInputValue('contactQQ') || this.currentSettings.contact?.qq || '',
            phone: this.getInputValue('contactPhone') || this.currentSettings.contact?.phone || '',
            workingHours: this.getInputValue('workingHours') || this.currentSettings.contact?.workingHours || '9:00-21:00',
            address: this.getInputValue('contactAddress') || this.currentSettings.contact?.address || '点击右下角客服图标',
            supportNote: this.getInputValue('supportNote') || this.currentSettings.contact?.supportNote || '为了确保账户安全和服务质量，我们采用人工开通方式。'
        };

        const adminData = {
            name: this.getInputValue('adminName') || this.currentSettings.admin?.name || 'MOMO',
            email: this.getInputValue('adminEmail') || this.currentSettings.admin?.email || 'admin@novel-site.com',
            bio: this.getInputValue('adminBio') || this.currentSettings.admin?.bio || '网站管理员，致力于为用户提供优质的阅读体验'
        };

        const membershipData = {
            enableMembership: this.getCheckboxValue('enableMembership'),
            premiumPrice: {
                monthly: parseFloat(this.getInputValue('premiumMonthly')) || this.currentSettings.membership?.premiumPrice?.monthly || 19.9,
                quarterly: parseFloat(this.getInputValue('premiumQuarterly')) || this.currentSettings.membership?.premiumPrice?.quarterly || 49.9,
                yearly: parseFloat(this.getInputValue('premiumYearly')) || this.currentSettings.membership?.premiumPrice?.yearly || 159.9
            },
            vipPrice: {
                monthly: parseFloat(this.getInputValue('vipMonthly')) || this.currentSettings.membership?.vipPrice?.monthly || 39.9,
                quarterly: parseFloat(this.getInputValue('vipQuarterly')) || this.currentSettings.membership?.vipPrice?.quarterly || 99.9,
                yearly: parseFloat(this.getInputValue('vipYearly')) || this.currentSettings.membership?.vipPrice?.yearly || 299.9
            }
        };

        return {
            website: websiteData,
            contact: contactData,
            admin: adminData,
            membership: membershipData,
            meta: {
                ...this.currentSettings.meta,
                lastUpdated: new Date().toISOString(),
                updatedBy: 'admin'
            }
        };
    }

    /**
     * 保存网站设置
     */
    async saveWebsiteSettings() {
        const websiteData = {
            name: this.getInputValue('websiteName'),
            description: this.getInputValue('websiteDescription'),
            keywords: this.getInputValue('websiteKeywords')
        };

        // 验证必填字段
        if (!websiteData.name) {
            this.showError('网站名称不能为空');
            return;
        }

        // 获取完整的设置数据，只更新网站部分
        const fullSettings = this.prepareFullSettings();
        fullSettings.website = { ...fullSettings.website, ...websiteData };

        await this.saveSettings(fullSettings, '网站信息保存成功');
    }

    /**
     * 保存联系方式设置
     */
    async saveContactSettings() {
        const contactData = {
            wechat: this.getInputValue('contactWechat'),
            email: this.getInputValue('contactEmail'),
            qq: this.getInputValue('contactQQ'),
            phone: this.getInputValue('contactPhone'),
            workingHours: this.getInputValue('workingHours'),
            address: this.getInputValue('contactAddress'),
            supportNote: this.getInputValue('supportNote')
        };

        // 验证必填字段
        if (!contactData.wechat) {
            this.showError('微信号不能为空');
            return;
        }

        if (!contactData.email) {
            this.showError('邮箱地址不能为空');
            return;
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactData.email)) {
            this.showError('邮箱格式不正确');
            return;
        }

        // 获取完整的设置数据，只更新联系方式部分
        const fullSettings = this.prepareFullSettings();
        fullSettings.contact = { ...fullSettings.contact, ...contactData };

        await this.saveSettings(fullSettings, '联系方式保存成功');
    }

    /**
     * 保存管理员设置
     */
    async saveAdminSettings() {
        const adminData = {
            name: this.getInputValue('adminName'),
            email: this.getInputValue('adminEmail'),
            bio: this.getInputValue('adminBio')
        };

        // 验证邮箱格式（如果填写了邮箱）
        if (adminData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(adminData.email)) {
                this.showError('管理员邮箱格式不正确');
                return;
            }
        }

        // 获取完整的设置数据，只更新管理员部分
        const fullSettings = this.prepareFullSettings();
        fullSettings.admin = { ...fullSettings.admin, ...adminData };

        await this.saveSettings(fullSettings, '管理员信息保存成功');
    }

    /**
     * 保存会员设置
     */
    async saveMembershipSettings() {
        const membershipData = {
            enableMembership: this.getCheckboxValue('enableMembership'),
            premiumPrice: {
                monthly: parseFloat(this.getInputValue('premiumMonthly')) || 19.9,
                quarterly: parseFloat(this.getInputValue('premiumQuarterly')) || 49.9,
                yearly: parseFloat(this.getInputValue('premiumYearly')) || 159.9
            },
            vipPrice: {
                monthly: parseFloat(this.getInputValue('vipMonthly')) || 39.9,
                quarterly: parseFloat(this.getInputValue('vipQuarterly')) || 99.9,
                yearly: parseFloat(this.getInputValue('vipYearly')) || 299.9
            }
        };

        // 获取完整的设置数据，只更新会员部分
        const fullSettings = this.prepareFullSettings();
        fullSettings.membership = { ...fullSettings.membership, ...membershipData };

        await this.saveSettings(fullSettings, '会员设置保存成功');
    }

    /**
     * 保存设置到服务器
     */
    async saveSettings(settingsData, successMessage = '设置保存成功') {
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settingsData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentSettings = { ...this.currentSettings, ...settingsData };
                this.showSuccess(successMessage);
            } else {
                this.showError('保存失败: ' + result.message);
            }
        } catch (error) {
            console.error('保存设置失败:', error);
            this.showError('保存失败，请检查网络连接');
        }
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        const toast = document.getElementById('settingsSuccessToast');
        const messageElement = document.getElementById('settingsSuccessMessage');
        
        if (toast && messageElement) {
            messageElement.textContent = message;
            toast.classList.remove('translate-x-full');
            
            setTimeout(() => {
                toast.classList.add('translate-x-full');
            }, 3000);
        }
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        const toast = document.getElementById('settingsErrorToast');
        const messageElement = document.getElementById('settingsErrorMessage');
        
        if (toast && messageElement) {
            messageElement.textContent = message;
            toast.classList.remove('translate-x-full');
            
            setTimeout(() => {
                toast.classList.add('translate-x-full');
            }, 3000);
        }
    }
}

// 全局函数，供HTML调用
function switchSettingsTab(tabName) {
    // 更新选项卡样式
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.remove('border-purple-500', 'text-purple-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('border-transparent', 'text-gray-500');
        activeBtn.classList.add('border-purple-500', 'text-purple-600');
    }
    
    // 显示对应的内容
    document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const activeContent = document.getElementById(`${tabName}-settings-tab`);
    if (activeContent) {
        activeContent.style.display = 'block';
    }
}

// 全局保存函数
function saveWebsiteSettings() {
    if (window.settingsManager) {
        window.settingsManager.saveWebsiteSettings();
    }
}

function saveContactSettings() {
    if (window.settingsManager) {
        window.settingsManager.saveContactSettings();
    }
}

function saveAdminSettings() {
    if (window.settingsManager) {
        window.settingsManager.saveAdminSettings();
    }
}

function saveMembershipSettings() {
    if (window.settingsManager) {
        window.settingsManager.saveMembershipSettings();
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
} else {
    window.SettingsManager = SettingsManager;
}
