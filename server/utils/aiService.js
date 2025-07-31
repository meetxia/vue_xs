const DataHandler = require('./dataHandler');
const config = require('../config');

class AIService {
    constructor() {
        this.services = config.ai.services;
        this.enabled = config.ai.enabled;
    }

    async analyzeNovel(content, title) {
        if (!this.enabled) {
            return null;
        }

        try {
            const prompt = this.buildAnalysisPrompt(content, title);
            const result = await this.callAIService(prompt);
            return this.parseAIResponse(result);
        } catch (error) {
            console.error('AI分析失败:', error);
            return null;
        }
    }

    buildAnalysisPrompt(content, title) {
        const categories = DataHandler.readCategoriesData();
        const categoryNames = categories.categories.map(c => c.name).join('、');
        
        return `请分析以下小说内容，提供分类和标签建议：

标题：${title}

内容摘录：${content.substring(0, 1000)}...

请按以下JSON格式返回分析结果：
{
  "category": "分类名称（从以下选择：${categoryNames}）",
  "confidence": 0.8,
  "tags": ["#标签1", "#标签2", "#标签3"],
  "summary": "简洁的内容摘要（150字以内）",
  "reasoning": "分析理由"
}

注意：
1. 分类必须从提供的选项中选择
2. 标签要以#开头，贴合内容特点
3. 摘要要简洁明了，突出主要情节
4. 置信度范围0-1`;
    }

    async callAIService(prompt) {
        if (this.services.deepseek.apiKey) {
            const response = await fetch(this.services.deepseek.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.services.deepseek.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`AI服务请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        }

        return null;
    }

    parseAIResponse(response) {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                             response.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                return JSON.parse(jsonStr);
            }
            
            return null;
        } catch (error) {
            console.error('解析AI响应失败:', error);
            return null;
        }
    }

    enableService(serviceName, apiKey) {
        if (this.services[serviceName]) {
            this.services[serviceName].apiKey = apiKey;
            this.enabled = true;
            console.log(`AI服务 ${this.services[serviceName].name} 已启用`);
        }
    }
}

module.exports = AIService;