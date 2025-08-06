const express = require('express');
const router = express.Router();

const config = require('../config');
const { DataHandler, UserUtils } = require('../utils');
const { authenticateToken } = require('../middleware');

// 获取用户会员状态
router.get('/status', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const membershipStatus = UserUtils.getUserMembershipStatus(user);
        
        res.json({
            success: true,
            data: {
                ...membershipStatus,
                startDate: user.membership?.startDate || user.startDate,
                autoRenew: user.membership?.autoRenew || user.autoRenew || false,
                paymentHistory: user.membership?.paymentHistory || user.paymentHistory || []
            }
        });
    } catch (error) {
        console.error('获取会员状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 开通/升级会员 - 需要管理员权限或支付验证
router.post('/upgrade', authenticateToken, (req, res) => {
    try {
        const { membershipType, duration, paymentMethod, paymentProof, adminOverride } = req.body;
        
        // 获取用户信息
        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 安全检查：只允许管理员或有效支付证明的请求
        const isAdmin = user.role === 'admin';
        const hasValidPaymentProof = paymentProof && paymentProof.verified === true;
        
        if (!isAdmin && !hasValidPaymentProof && !adminOverride) {
            return res.status(403).json({
                success: false,
                message: '无权限直接开通会员。请联系客服完成支付流程。',
                requiresPayment: true,
                contactInfo: {
                    wechat: 'novel-service',
                    email: 'service@novel-site.com',
                    workHours: '9:00-21:00'
                }
            });
        }
        
        // 验证输入
        if (!['premium', 'vip'].includes(membershipType)) {
            return res.status(400).json({
                success: false,
                message: '无效的会员类型'
            });
        }
        
        if (!duration || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: '无效的时长'
            });
        }
        
        // 获取价格
        const price = config.membershipPrices[membershipType][duration];
        if (!price) {
            return res.status(400).json({
                success: false,
                message: '无效的时长选择'
            });
        }
        
        // 计算会员结束时间
        const now = new Date();
        const currentMembership = UserUtils.getUserMembershipStatus(user);
        
        let startDate = now;
        if (currentMembership.isValid && currentMembership.endDate) {
            startDate = new Date(currentMembership.endDate);
        }
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);
        
        // 更新用户会员信息
        if (!user.membership) {
            user.membership = { paymentHistory: [] };
        }
        
        user.membership.type = membershipType;
        user.membership.status = 'active';
        user.membership.startDate = startDate.toISOString();
        user.membership.endDate = endDate.toISOString();
        user.membership.autoRenew = false;
        
        // 添加支付记录
        const paymentRecord = {
            id: Date.now(),
            amount: price,
            type: membershipType,
            duration: duration,
            paymentTime: now.toISOString(),
            paymentMethod: paymentMethod || 'manual_verification',
            status: 'completed',
            verifiedBy: isAdmin ? 'admin_override' : 'payment_proof',
            adminUserId: isAdmin ? user.id : null
        };
        
        user.membership.paymentHistory.push(paymentRecord);
        user.lastActivity = now.toISOString();
        
        if (DataHandler.writeUsersData(userData)) {
            res.json({
                success: true,
                data: {
                    membershipType: membershipType,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    amount: price,
                    paymentRecord: paymentRecord
                },
                message: `${membershipType === 'premium' ? '高级' : 'VIP'}会员开通成功`
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('开通会员失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 管理员开通会员功能
router.post('/admin/activate', authenticateToken, (req, res) => {
    try {
        const { userId, membershipType, duration, notes } = req.body;
        
        const userData = DataHandler.readUsersData();
        const adminUser = userData.users.find(u => u.id === req.user.userId);
        
        // 验证管理员权限
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '需要管理员权限'
            });
        }
        
        const targetUser = userData.users.find(u => u.id === parseInt(userId));
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: '目标用户不存在'
            });
        }
        
        // 验证输入
        if (!['premium', 'vip'].includes(membershipType)) {
            return res.status(400).json({
                success: false,
                message: '无效的会员类型'
            });
        }
        
        if (!duration || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: '无效的时长'
            });
        }
        
        // 计算会员结束时间
        const now = new Date();
        const currentMembership = UserUtils.getUserMembershipStatus(targetUser);
        
        let startDate = now;
        if (currentMembership.isValid && currentMembership.endDate) {
            startDate = new Date(currentMembership.endDate);
        }
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);
        
        // 更新用户会员信息
        if (!targetUser.membership) {
            targetUser.membership = { paymentHistory: [] };
        }
        
        targetUser.membership.type = membershipType;
        targetUser.membership.status = 'active';
        targetUser.membership.startDate = startDate.toISOString();
        targetUser.membership.endDate = endDate.toISOString();
        targetUser.membership.autoRenew = false;
        
        // 添加管理员操作记录
        const operationRecord = {
            id: Date.now(),
            type: 'admin_activation',
            membershipType: membershipType,
            duration: duration,
            operationTime: now.toISOString(),
            adminUserId: adminUser.id,
            adminUsername: adminUser.username,
            notes: notes || '管理员开通',
            status: 'completed'
        };
        
        targetUser.membership.paymentHistory.push(operationRecord);
        targetUser.lastActivity = now.toISOString();
        
        if (DataHandler.writeUsersData(userData)) {
            res.json({
                success: true,
                data: {
                    userId: targetUser.id,
                    username: targetUser.username,
                    membershipType: membershipType,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    duration: duration,
                    operatedBy: adminUser.username
                },
                message: `成功为用户 ${targetUser.username} 开通${membershipType === 'premium' ? '高级' : 'VIP'}会员`
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('管理员开通会员失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取会员价格套餐
router.get('/plans', (req, res) => {
    try {
        const plans = {
            premium: {
                name: '高级会员',
                description: '解锁大部分精选内容',
                benefits: ['无广告阅读', '高级内容访问', '离线下载', '优先客服'],
                prices: [
                    { duration: 1, price: 19.9, label: '1个月' },
                    { duration: 3, price: 49.9, label: '3个月', discount: '17%' },
                    { duration: 6, price: 89.9, label: '6个月', discount: '25%' },
                    { duration: 12, price: 149.9, label: '12个月', discount: '38%' }
                ]
            },
            vip: {
                name: 'VIP会员',
                description: '解锁所有内容，享受最高级服务',
                benefits: ['无广告阅读', '全部内容访问', '离线下载', '专属客服', 'VIP专区', '优先更新'],
                prices: [
                    { duration: 1, price: 39.9, label: '1个月' },
                    { duration: 3, price: 99.9, label: '3个月', discount: '17%' },
                    { duration: 6, price: 179.9, label: '6个月', discount: '25%' },
                    { duration: 12, price: 299.9, label: '12个月', discount: '38%' }
                ]
            }
        };
        
        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('获取会员套餐失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router;