// 数据统计模块
class StatsManager {
    constructor() {
        this.statsData = {};
        this.refreshInterval = null;
    }

    // 加载统计数据
    async loadStats() {
        try {
            const response = await apiClient.get('/api/stats');
            if (!response) return;

            const { result } = response;
            if (result.success) {
                this.statsData = result.data;
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
            this.setDefaultStats();
        }
    }

    // 更新统计数据显示
    updateStatsDisplay() {
        const stats = this.statsData;
        
        // 更新基础统计
        this.updateElement('totalNovels', stats.totalNovels || 0);
        this.updateElement('totalViews', stats.totalViews || 0);
        this.updateElement('publishedCount', stats.publishedNovels || 0);
        
        // 更新草稿数量
        const draftCount = window.draftManager ? window.draftManager.drafts.length : 0;
        this.updateElement('draftCount', draftCount);

        // 更新其他统计信息
        this.updateElement('totalUsers', stats.totalUsers || 0);
        this.updateElement('onlineUsers', stats.onlineUsers || 0);
        this.updateElement('newUsers', stats.newUsersToday || 0);
        this.updateElement('activeSessions', stats.enabledUsers || 0);

        // 更新图表
        this.updateCharts();
    }

    // 更新元素内容
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = this.formatNumber(value);
        }
    }

    // 格式化数字显示
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // 设置默认统计数据
    setDefaultStats() {
        this.updateElement('totalNovels', 0);
        this.updateElement('totalViews', 0);
        this.updateElement('publishedCount', 0);
        this.updateElement('draftCount', 0);
        this.updateElement('totalUsers', 0);
        this.updateElement('onlineUsers', 0);
        this.updateElement('newUsers', 0);
        this.updateElement('activeSessions', 0);
    }

    // 更新图表
    updateCharts() {
        this.updateViewsChart();
        this.updateUsersChart();
        this.updateContentChart();
    }

    // 更新阅读量图表
    updateViewsChart() {
        const chartElement = document.getElementById('viewsChart');
        if (!chartElement) return;

        const stats = this.statsData;
        const viewsData = stats.viewsHistory || this.generateMockViewsData();
        
        // 创建简单的柱状图
        chartElement.innerHTML = this.createBarChart(viewsData, '阅读量趋势', '#3B82F6');
    }

    // 更新用户图表
    updateUsersChart() {
        const chartElement = document.getElementById('usersChart');
        if (!chartElement) return;

        const stats = this.statsData;
        const usersData = stats.usersHistory || this.generateMockUsersData();
        
        chartElement.innerHTML = this.createLineChart(usersData, '用户增长', '#10B981');
    }

    // 更新内容图表
    updateContentChart() {
        const chartElement = document.getElementById('contentChart');
        if (!chartElement) return;

        const stats = this.statsData;
        const contentData = {
            novels: stats.totalNovels || 0,
            drafts: window.draftManager ? window.draftManager.drafts.length : 0,
            published: stats.publishedNovels || 0
        };
        
        chartElement.innerHTML = this.createPieChart(contentData, '内容分布');
    }

    // 创建柱状图
    createBarChart(data, title, color) {
        const maxValue = Math.max(...data.map(d => d.value));
        const bars = data.map(d => {
            const height = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
            return `
                <div class="bar-item">
                    <div class="bar" style="height: ${height}%; background-color: ${color};" title="${d.label}: ${d.value}"></div>
                    <div class="bar-label">${d.label}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="chart-container">
                <h3 class="chart-title">${title}</h3>
                <div class="bar-chart">
                    ${bars}
                </div>
            </div>
        `;
    }

    // 创建折线图
    createLineChart(data, title, color) {
        const maxValue = Math.max(...data.map(d => d.value));
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = maxValue > 0 ? 100 - (d.value / maxValue) * 100 : 50;
            return `${x},${y}`;
        }).join(' ');

        return `
            <div class="chart-container">
                <h3 class="chart-title">${title}</h3>
                <div class="line-chart">
                    <svg viewBox="0 0 100 100" class="chart-svg">
                        <polyline points="${points}" 
                                  stroke="${color}" 
                                  stroke-width="2" 
                                  fill="none"/>
                        ${data.map((d, i) => {
                            const x = (i / (data.length - 1)) * 100;
                            const y = maxValue > 0 ? 100 - (d.value / maxValue) * 100 : 50;
                            return `<circle cx="${x}" cy="${y}" r="2" fill="${color}" title="${d.label}: ${d.value}"/>`;
                        }).join('')}
                    </svg>
                    <div class="chart-labels">
                        ${data.map(d => `<span class="label">${d.label}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // 创建饼图
    createPieChart(data, title) {
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        if (total === 0) {
            return `
                <div class="chart-container">
                    <h3 class="chart-title">${title}</h3>
                    <div class="pie-chart-empty">暂无数据</div>
                </div>
            `;
        }

        const colors = ['#3B82F6', '#10B981', '#F59E0B'];
        let currentAngle = 0;
        const segments = Object.entries(data).map(([key, value], index) => {
            const percentage = (value / total) * 100;
            const angle = (value / total) * 360;
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const x1 = 50 + 40 * Math.cos((currentAngle - 90) * Math.PI / 180);
            const y1 = 50 + 40 * Math.sin((currentAngle - 90) * Math.PI / 180);
            const x2 = 50 + 40 * Math.cos((currentAngle + angle - 90) * Math.PI / 180);
            const y2 = 50 + 40 * Math.sin((currentAngle + angle - 90) * Math.PI / 180);
            
            const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            currentAngle += angle;
            
            return {
                path: pathData,
                color: colors[index % colors.length],
                label: this.getChartLabel(key),
                value: value,
                percentage: percentage.toFixed(1)
            };
        });

        const svgPaths = segments.map(s => 
            `<path d="${s.path}" fill="${s.color}" stroke="white" stroke-width="1" title="${s.label}: ${s.value}"/>`
        ).join('');

        const legend = segments.map(s => 
            `<div class="legend-item">
                <span class="legend-color" style="background-color: ${s.color}"></span>
                <span class="legend-text">${s.label}: ${s.value} (${s.percentage}%)</span>
            </div>`
        ).join('');

        return `
            <div class="chart-container">
                <h3 class="chart-title">${title}</h3>
                <div class="pie-chart">
                    <svg viewBox="0 0 100 100" class="chart-svg">
                        ${svgPaths}
                    </svg>
                    <div class="chart-legend">
                        ${legend}
                    </div>
                </div>
            </div>
        `;
    }

    // 获取图表标签
    getChartLabel(key) {
        const labels = {
            novels: '总作品',
            drafts: '草稿',
            published: '已发布'
        };
        return labels[key] || key;
    }

    // 生成模拟阅读量数据
    generateMockViewsData() {
        const days = 7;
        const data = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push({
                label: date.getMonth() + 1 + '/' + date.getDate(),
                value: Math.floor(Math.random() * 1000) + 100
            });
        }
        return data;
    }

    // 生成模拟用户数据
    generateMockUsersData() {
        const days = 7;
        const data = [];
        let baseValue = 100;
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            baseValue += Math.floor(Math.random() * 20) - 5;
            data.push({
                label: date.getMonth() + 1 + '/' + date.getDate(),
                value: Math.max(0, baseValue)
            });
        }
        return data;
    }

    // 导出统计数据
    async exportStats(format = 'json') {
        try {
            const response = await apiClient.get('/api/stats/export');
            if (!response) return;

            const { result } = response;
            if (result.success) {
                const data = result.data;
                
                if (format === 'json') {
                    this.downloadJSON(data, 'stats-export.json');
                } else if (format === 'csv') {
                    this.downloadCSV(data, 'stats-export.csv');
                }
                
                utils.showMessage('统计数据导出成功', 'success');
            } else {
                utils.showMessage('导出失败: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('导出统计数据失败:', error);
            utils.showMessage('导出失败，请检查网络连接', 'error');
        }
    }

    // 下载JSON文件
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    // 下载CSV文件
    downloadCSV(data, filename) {
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadBlob(blob, filename);
    }

    // 转换为CSV格式
    convertToCSV(data) {
        const headers = Object.keys(data);
        const rows = [headers.join(',')];
        
        // 如果数据是对象，转为单行
        const values = headers.map(header => data[header]);
        rows.push(values.join(','));
        
        return rows.join('\n');
    }

    // 下载文件
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 启动自动刷新
    startAutoRefresh(interval = 60000) {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.loadStats();
        }, interval);
    }

    // 停止自动刷新
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // 手动刷新统计数据
    refreshStats() {
        this.loadStats();
        utils.showMessage('统计数据已刷新', 'success');
    }

    // 获取实时数据
    async getRealTimeStats() {
        try {
            const response = await apiClient.get('/api/stats/realtime');
            if (!response) return null;

            const { result } = response;
            if (result.success) {
                return result.data;
            }
        } catch (error) {
            console.error('获取实时统计数据失败:', error);
        }
        return null;
    }

    // 生成统计报告
    generateReport() {
        const stats = this.statsData;
        const reportDate = new Date().toLocaleDateString('zh-CN');
        
        const report = {
            title: '管理后台统计报告',
            date: reportDate,
            summary: {
                totalNovels: stats.totalNovels || 0,
                totalViews: stats.totalViews || 0,
                totalUsers: stats.totalUsers || 0,
                onlineUsers: stats.onlineUsers || 0
            },
            details: {
                publishedNovels: stats.publishedNovels || 0,
                draftCount: window.draftManager ? window.draftManager.drafts.length : 0,
                newUsersToday: stats.newUsersToday || 0,
                enabledUsers: stats.enabledUsers || 0
            }
        };

        return report;
    }
}

// 创建全局统计管理实例
window.statsManager = new StatsManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsManager;
}