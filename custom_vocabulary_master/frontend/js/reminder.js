
// custom_vocabulary_master/frontend/js/reminder.js
/**
 * 学习提醒功能模块
 * 负责检查学习进度并在达到提醒时间时通知用户
 */

class Reminder {
    constructor() {
        this.reminderInterval = null;
        this.lastReminderTime = null;
        this.settings = {
            dailyGoal: 20,
            reminderTime: null,
            restDuration: 2 // 默认休息时长为2分钟
        };
        this.notificationRequested = false;
        this.restModalShown = false; // 跟踪休息提示是否已显示
    }

    /**
     * 初始化提醒功能
     */
    init() {
        this.loadSettings();
        this.requestNotificationPermission();
        this.startChecking();
        this.createRestModal(); // 创建休息提示弹窗
        console.log("提醒初始化完成，设置时间:", this.settings.reminderTime, "休息时长:", this.settings.restDuration, "分钟");
    }

    /**
     * 创建休息提示弹窗
     */
    createRestModal() {
        // 检查是否已存在
        if (document.getElementById('restModal')) {
            return;
        }

        // 创建弹窗元素
        const modal = document.createElement('div');
        modal.id = 'restModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';

        // 计算休息时间显示（分:秒）
        const minutes = Math.floor(this.settings.restDuration);
        const seconds = Math.round((this.settings.restDuration - minutes) * 60);
        const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // 创建弹窗内容
        modal.innerHTML = `
            <div class="bg-white text-gray-800 rounded-xl p-6 max-w-md w-full rest-modal-content">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-indigo-600">休息提醒</h3>
                    <button id="closeRestBtn" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-6 text-center">
                    <div class="text-6xl mb-4">🧘</div>
                    <p class="text-lg mb-3">单词虽好可不要贪背喔！</p>
                    <p>让眼睛休息一下吧！</p>
                </div>
                
                <div class="flex justify-center">
                    <div class="rest-timer" id="restTimer">${timeDisplay}</div>
                </div>
                
                <div class="flex justify-center mt-4">
                    <button id="skipRestBtn" class="py-2 px-6 bg-gray-400 text-white rounded-lg mr-2">
                        跳过
                    </button>
                    <button id="startRestBtn" class="py-2 px-6 bg-indigo-600 text-white rounded-lg">
                        开始休息
                    </button>
                </div>
            </div>
        `;

        // 添加到文档中
        document.body.appendChild(modal);

        // 添加关闭按钮事件
        document.getElementById('closeRestBtn').addEventListener('click', () => {
            this.hideRestModal();
        });

        // 添加跳过按钮事件
        document.getElementById('skipRestBtn').addEventListener('click', () => {
            this.hideRestModal();
        });

        // 添加开始休息按钮事件
        document.getElementById('startRestBtn').addEventListener('click', () => {
            this.startRestTimer();
        });
    }

    /**
     * 显示休息提示弹窗
     */
    showRestModal() {
        if (this.restModalShown) {
            return; // 如果已经显示过，则不再显示
        }

        const modal = document.getElementById('restModal');
        if (modal) {
            // 重置计时器显示，根据当前设置的休息时长
            const minutes = Math.floor(this.settings.restDuration);
            const seconds = Math.round((this.settings.restDuration - minutes) * 60);
            const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            document.getElementById('restTimer').textContent = timeDisplay;
            
            modal.classList.remove('hidden');
            this.restModalShown = true;
            
            // 播放提示音
            this.playReminderSound();
        }
    }

    /**
     * 隐藏休息提示弹窗
     */
    hideRestModal() {
        const modal = document.getElementById('restModal');
        if (modal) {
            modal.classList.add('hidden');
            
            // 如果计时器正在运行，清除它
            if (this.restTimerInterval) {
                clearInterval(this.restTimerInterval);
                this.restTimerInterval = null;
            }
        }
    }

    /**
     * 开始休息计时器
     */
    startRestTimer() {
        // 如果已经有计时器在运行，先清除
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
        }

        const timerElement = document.getElementById('restTimer');
        const startRestBtn = document.getElementById('startRestBtn');
        const skipRestBtn = document.getElementById('skipRestBtn');
        
        // 禁用按钮
        startRestBtn.disabled = true;
        startRestBtn.classList.add('opacity-50');
        startRestBtn.textContent = '休息中...';
        
        // 根据设置计算休息总秒数
        let remainingSeconds = Math.round(this.settings.restDuration * 60);

        // 更新计时器显示
        const updateTimerDisplay = () => {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        // 开始计时
        this.restTimerInterval = setInterval(() => {
            remainingSeconds--;
            updateTimerDisplay();

            if (remainingSeconds <= 0) {
                // 时间到
                clearInterval(this.restTimerInterval);
                this.restTimerInterval = null;
                
                // 恢复按钮状态
                startRestBtn.disabled = false;
                startRestBtn.classList.remove('opacity-50');
                startRestBtn.textContent = '开始休息';
                
                // 播放完成音效
                this.playCompletionSound();
                
                // 显示完成消息
                timerElement.textContent = '休息完成!';
                
                // 3秒后关闭弹窗
                setTimeout(() => {
                    this.hideRestModal();
                }, 3000);
            }
        }, 1000);
    }

    /**
     * 播放休息完成音效
     */
    playCompletionSound() {
        try {
            const audio = new Audio('https://8bituniverse.com/sounds/success.mp3');
            audio.volume = 0.3;
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('播放完成音效失败:', error);
                });
            }
        } catch (e) {
            console.error('创建音频对象失败:', e);
        }
    }

    /**
     * 请求通知权限
     */
    requestNotificationPermission() {
        if (!("Notification" in window)) {
            console.log("此浏览器不支持桌面通知");
            return;
        }

        if (Notification.permission !== 'granted' && Notification.permission !== 'denied' && !this.notificationRequested) {
            this.notificationRequested = true;
            Notification.requestPermission().then(permission => {
                console.log("通知权限状态:", permission);
                if (permission === 'granted') {
                    this.showWelcomeNotification();
                }
            });
        }
    }

    /**
     * 显示欢迎通知
     */
    showWelcomeNotification() {
        if (Notification.permission === 'granted') {
            new Notification('小关记单词', {
                body: '提醒功能已启用，将在设定的时间提醒您学习',
                icon: 'https://picsum.photos/64'
            });
        }
    }

    /**
     * 从本地存储加载设置
     */
    loadSettings() {
        const savedSettings = localStorage.getItem('vocabularySettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                this.settings = {
                    dailyGoal: parsed.dailyGoal || 20,
                    reminderTime: parsed.reminderTime || null,
                    restDuration: parsed.restDuration || 2 // 读取休息时长，默认2分钟
                };
                console.log("已加载提醒设置:", this.settings);
            } catch (e) {
                console.error("解析设置时出错:", e);
            }
        }
    }

    /**
     * 开始定期检查是否需要提醒
     */
    startChecking() {
        // 清除已有定时器
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
        }

        // 如果没有设置提醒时间，则不启动
        if (!this.settings.reminderTime) {
            console.log("未设置提醒时间，不启动提醒检查");
            return;
        }

        console.log("开始检查提醒，间隔: 60秒");

        // 每分钟检查一次
        this.reminderInterval = setInterval(() => {
            this.checkReminder();
        }, 60000);

        // 立即检查一次
        this.checkReminder();
    }

    /**
     * 检查是否需要提醒
     */
    checkReminder() {
        if (!this.settings.reminderTime) {
            return;
        }

        const now = new Date();
        const currentTime = this.formatTime(now);
        
        console.log(`当前时间: ${currentTime}, 提醒时间: ${this.settings.reminderTime}`);
        
        // 比较当前时间和提醒时间是否匹配
        if (currentTime === this.settings.reminderTime) {
            // 检查是否今天已经提醒过
            const today = new Date().toDateString();
            const lastReminderDay = this.lastReminderTime ? new Date(this.lastReminderTime).toDateString() : null;
            
            if (lastReminderDay !== today) {
                console.log("触发提醒!");
                this.showReminder();
                this.showRestModal(); // 同时显示休息提醒弹窗
                this.lastReminderTime = now.getTime();
                localStorage.setItem('lastReminderTime', this.lastReminderTime);
            } else {
                console.log("今天已经提醒过了");
            }
        }
    }

    /**
     * 显示提醒通知
     */
    showReminder() {
        // 检查学习进度
        const progress = this.getTodayProgress();
        const remaining = Math.max(0, this.settings.dailyGoal - progress.learnedToday);

        // 如果已经完成目标，则不提醒
        if (remaining <= 0) {
            console.log("今日目标已完成，不需要提醒");
            return;
        }

        // 创建通知
        if (Notification && Notification.permission === 'granted') {
            const notification = new Notification('小关记单词提醒', {
                body: `今日还有 ${remaining} 个单词需要学习，点击继续学习`,
                icon: 'https://picsum.photos/64',
                requireInteraction: true  // 通知会一直显示，直到用户交互
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // 播放提示音
            this.playReminderSound();
        } else if (Notification && Notification.permission !== 'denied') {
            // 如果还没有请求过权限
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showReminder();
                }
            });
        } else {
            // 如果不支持通知或被拒绝，则使用alert
            alert(`小关记单词提醒: 今日还有 ${remaining} 个单词需要学习!`);
            this.playReminderSound();
        }
    }

    /**
     * 播放提醒音效
     */
    playReminderSound() {
        try {
            const audio = new Audio('https://8bituniverse.com/sounds/notification.mp3');
            audio.volume = 0.3;
            // 使用promise捕获可能的播放错误
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('播放提醒音效失败:', error);
                    // 尝试使用备用音效或不播放
                });
            }
        } catch (e) {
            console.error('创建音频对象失败:', e);
        }
    }

    /**
     * 获取今日学习进度
     */
    getTodayProgress() {
        const savedProgress = localStorage.getItem('dailyProgress');
        let learnedToday = 0;

        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                const progressDate = new Date(progress.date);
                const today = new Date();
                
                if (this.isSameDay(progressDate, today)) {
                    learnedToday = progress.count || 0;
                }
            } catch (e) {
                console.error("解析进度数据出错:", e);
            }
        }

        return {
            learnedToday,
            dailyGoal: this.settings.dailyGoal
        };
    }

    /**
     * 更新提醒设置
     * @param {Object} newSettings - 新设置对象
     */
    updateSettings(newSettings) {
        const oldTime = this.settings.reminderTime;
        
        this.settings = {
            ...this.settings,
            ...newSettings
        };
        
        console.log("更新提醒设置:", this.settings);
        
        // 如果提醒时间发生变化，重新开始检查
        if (oldTime !== this.settings.reminderTime) {
            this.startChecking();
            // 重置休息提示弹窗显示状态
            this.restModalShown = false;
        }

        // 重新创建休息模态框以更新时间显示
        const oldModal = document.getElementById('restModal');
        if (oldModal) {
            document.body.removeChild(oldModal);
        }
        this.createRestModal();
    }

    /**
     * 格式化时间为HH:MM
     */
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * 检查两个日期是否是同一天
     */
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
}

// 创建全局提醒实例
const reminder = new Reminder();

// 初始化提醒功能
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM加载完成，初始化提醒模块");
    reminder.init();
});

// 导出模块
window.reminder = reminder;
