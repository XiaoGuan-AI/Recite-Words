
// custom_vocabulary_master/frontend/js/app.js
document.addEventListener('DOMContentLoaded', function() {
    // 初始化粒子效果
    particlesJS('particles-js', {
        particles: {
            number: { 
                value: 80,
                density: { 
                    enable: true,
                    value_area: 800 
                }
            },
            color: {
                value: "#e0e0e0"
            },
            shape: {
                type: "circle",
                stroke: {
                    width: 0,
                    color: "#000000"
                }
            },
            opacity: {
                value: 0.5,
                random: true,
                anim: {
                    enable: false,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false
                }
            },
            size: {
                value: 3,
                random: true,
                anim: {
                    enable: false,
                    speed: 40,
                    size_min: 0.1,
                    sync: false
                }
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#d0d0d0",
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false,
                attract: {
                    enable: true,
                    rotateX: 600,
                    rotateY: 1200
                }
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: {
                    enable: true,
                    mode: "grab"
                },
                onclick: {
                    enable: true,
                    mode: "push"
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 1
                    }
                },
                push: {
                    particles_nb: 4
                }
            }
        },
        retina_detect: true
    });

    // 应用状态
    let currentWordIndex = 0;
    let wordsList = [];
    let learningMode = 'flashcard';
    let dailyGoal = 20;
    let learnedToday = 0;
    let settings = {
        dailyGoal: 20,
        reminderTime: null,
        restDuration: 2 // 默认休息时长为2分钟
    };
    let isAnswerRevealed = false;
    let goalAchieved = false; // 跟踪目标是否已达成

    // DOM元素
    const welcomeView = document.getElementById('welcomeView');
    const learningView = document.getElementById('learningView');
    const wordDisplay = document.getElementById('wordDisplay');
    const meaningDisplay = document.getElementById('meaningDisplay');
    const progressCount = document.getElementById('progressCount');
    const remainingCount = document.getElementById('remainingCount');
    const settingsModal = document.getElementById('settingsModal');
    const importModal = document.getElementById('importModal');
    const editWordModal = document.getElementById('editWordModal');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const sentenceDisplay = document.getElementById('sentenceDisplay');
    const fillBlankInput = document.getElementById('fillBlankInput');
    const meaningForSpelling = document.getElementById('meaningForSpelling');
    const spellingInput = document.getElementById('spellingInput');
    const checkFillBlankBtn = document.getElementById('checkFillBlankBtn');
    const checkSpellingBtn = document.getElementById('checkSpellingBtn');
    const revealAnswerBtn = document.getElementById('revealAnswerBtn');
    const fireworksContainer = document.getElementById('fireworks-container');
    const restDurationInput = document.getElementById('restDurationInput');

    // 初始化应用
    function initApp() {
        loadSettings();
        loadProgress();
        updateProgressDisplay();
        bindEvents();
        checkGoalAchievement(); // 检查是否已达成目标
    }

    // 加载设置
    function loadSettings() {
        const savedSettings = localStorage.getItem('vocabularySettings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
            dailyGoal = settings.dailyGoal;
            
            if (settings.reminderTime) {
                document.getElementById('dailyGoalInput').value = settings.dailyGoal;
                document.getElementById('reminderTimeInput').value = settings.reminderTime;
            }
            
            // 加载休息时长设置
            if (settings.restDuration !== undefined) {
                restDurationInput.value = settings.restDuration;
            } else {
                // 默认值
                settings.restDuration = 2;
                restDurationInput.value = 2;
            }
        }
    }

    // 保存设置
    function saveSettings() {
        const newDailyGoal = parseInt(document.getElementById('dailyGoalInput').value) || 20;
        const newReminderTime = document.getElementById('reminderTimeInput').value;
        const newRestDuration = parseInt(restDurationInput.value) || 2;
        
        // 休息时长范围限制
        const restDuration = Math.min(Math.max(newRestDuration, 1), 60);
        
        // 更新本地设置
        settings.dailyGoal = newDailyGoal;
        settings.reminderTime = newReminderTime;
        settings.restDuration = restDuration;
        
        // 更新应用状态
        dailyGoal = newDailyGoal;
        
        // 保存到本地存储
        localStorage.setItem('vocabularySettings', JSON.stringify(settings));
        
        // 更新进度显示
        updateProgressDisplay();
        
        // 检查是否已达成目标
        checkGoalAchievement();
        
        // 更新提醒模块
        if (typeof reminder !== 'undefined') {
            reminder.updateSettings({
                dailyGoal: newDailyGoal,
                reminderTime: newReminderTime,
                restDuration: restDuration
            });
        }
        
        showToast('设置已保存');
        closeSettingsModal();
    }

    // 检查是否已达成目标
    function checkGoalAchievement() {
        goalAchieved = learnedToday >= dailyGoal;
    }

    // 加载学习进度
    function loadProgress() {
        const progress = localStorage.getItem('dailyProgress');
        if (progress) {
            const data = JSON.parse(progress);
            if (new Date(data.date).toDateString() === new Date().toDateString()) {
                learnedToday = data.count;
            }
        }
    }

    // 保存学习进度
    function saveProgress() {
        const progress = {
            date: new Date().toISOString(),
            count: learnedToday
        };
        localStorage.setItem('dailyProgress', JSON.stringify(progress));
    }

    // 更新进度显示
    function updateProgressDisplay() {
        progressCount.textContent = `${learnedToday}/${dailyGoal}`;
        remainingCount.textContent = Math.max(0, dailyGoal - learnedToday);
    }

    // 显示当前单词
    function showCurrentWord() {
        if (wordsList.length === 0) return;
        
        const currentWord = wordsList[currentWordIndex];
        isAnswerRevealed = false;
        
        // 重置按钮状态
        checkFillBlankBtn.textContent = '检查';
        checkSpellingBtn.textContent = '检查';
        checkFillBlankBtn.disabled = false;
        checkSpellingBtn.disabled = false;
        
        // 根据当前学习模式显示不同内容
        if (learningMode === 'flashcard') {
            wordDisplay.textContent = currentWord.word;
            meaningDisplay.textContent = currentWord.meaning;
            meaningDisplay.classList.add('hidden');
        } 
        else if (learningMode === 'fillBlank') {
            // 生成包含当前单词的句子
            const sentences = [
                `这个单词的意思是"${currentWord.meaning}"，请拼写: _____`,
                `请填写正确的单词: ${currentWord.meaning} -> _____`,
                `根据释义填写单词: "${currentWord.meaning}" 是 _____`
            ];
            sentenceDisplay.textContent = sentences[Math.floor(Math.random() * sentences.length)];
            fillBlankInput.value = '';
        } 
        else if (learningMode === 'spelling') {
            meaningForSpelling.textContent = currentWord.meaning;
            spellingInput.value = '';
        }
    }

    // 检查填空模式答案
    function checkFillBlankAnswer() {
        if (wordsList.length === 0) return;
        
        const currentWord = wordsList[currentWordIndex];
        const userAnswer = fillBlankInput.value.trim().toLowerCase();
        const correctAnswer = currentWord.word.toLowerCase();
        
        if (isAnswerRevealed) {
            // 如果已经显示答案，则进入下一个单词
            if (userAnswer === correctAnswer) {
                markAsKnown();
            } else {
                markAsUnknown();
            }
        } else {
            // 第一次点击检查，显示答案
            isAnswerRevealed = true;
            fillBlankInput.value = currentWord.word;
            checkFillBlankBtn.textContent = '继续';
            showToast(`正确答案: ${currentWord.word}`);
        }
    }

    // 检查拼写模式答案
    function checkSpellingAnswer() {
        if (wordsList.length === 0) return;
        
        const currentWord = wordsList[currentWordIndex];
        const userAnswer = spellingInput.value.trim().toLowerCase();
        const correctAnswer = currentWord.word.toLowerCase();
        
        if (isAnswerRevealed) {
            // 如果已经显示答案，则进入下一个单词
            if (userAnswer === correctAnswer) {
                markAsKnown();
            } else {
                markAsUnknown();
            }
        } else {
            // 第一次点击检查，显示答案
            isAnswerRevealed = true;
            spellingInput.value = currentWord.word;
            checkSpellingBtn.textContent = '继续';
            showToast(`正确答案: ${currentWord.word}`);
        }
    }

    // 显示答案
    function revealAnswer() {
        if (wordsList.length === 0) return;
        
        const currentWord = wordsList[currentWordIndex];
        isAnswerRevealed = true;
        
        if (learningMode === 'fillBlank') {
            fillBlankInput.value = currentWord.word;
            checkFillBlankBtn.textContent = '继续';
        } else if (learningMode === 'spelling') {
            spellingInput.value = currentWord.word;
            checkSpellingBtn.textContent = '继续';
        }
        
        showToast(`正确答案: ${currentWord.word}`);
    }

    // 显示提示消息
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // 创建烟花效果
    function createFireworks() {
        if (!fireworksContainer) return;
        
        // 清空容器
        fireworksContainer.innerHTML = '';
        fireworksContainer.classList.remove('hidden');
        
        // 创建烟花元素
        for (let i = 0; i < 10; i++) {
            const firework = document.createElement('div');
            firework.className = 'firework';
            
            // 随机位置
            const posX = Math.random() * 100;
            const posY = 50 + Math.random() * 40;
            const delay = Math.random() * 1.5;
            
            firework.style.left = `${posX}%`;
            firework.style.top = `${posY}%`;
            firework.style.animationDelay = `${delay}s`;
            
            // 随机颜色
            const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            firework.style.backgroundColor = color;
            
            // 添加粒子
            for (let j = 0; j < 12; j++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.backgroundColor = color;
                firework.appendChild(particle);
            }
            
            fireworksContainer.appendChild(firework);
        }
        
        // 显示祝贺消息
        const message = document.createElement('div');
        message.className = 'congrats-message';
        message.textContent = '🎉 恭喜你达成今日学习目标！🎉';
        fireworksContainer.appendChild(message);
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-fireworks-btn';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => {
            fireworksContainer.classList.add('hidden');
        });
        fireworksContainer.appendChild(closeBtn);
        
        // 自动关闭
        setTimeout(() => {
            fireworksContainer.classList.add('hidden');
        }, 8000);
    }

    // 绑定事件
    function bindEvents() {
        // 开始学习按钮
        document.getElementById('startLearningBtn').addEventListener('click', () => {
            wordsList = FileHandler.generateSampleWordsList();
            welcomeView.classList.add('hidden');
            learningView.classList.remove('hidden');
            showCurrentWord();
        });

        // 导入按钮
        document.getElementById('importBtn').addEventListener('click', openImportModal);
        document.getElementById('welcomeImportBtn').addEventListener('click', openImportModal);
        
        // 确认导入按钮
        document.getElementById('confirmImportBtn').addEventListener('click', () => {
            const fileInput = document.getElementById('fileInput');
            if (fileInput.files.length === 0) {
                showToast('请选择文件');
                return;
            }
            
            FileHandler.parseVocabularyFile(
                fileInput.files[0],
                (words) => {
                    wordsList = words;
                    currentWordIndex = 0;
                    welcomeView.classList.add('hidden');
                    learningView.classList.remove('hidden');
                    showCurrentWord();
                    closeImportModal();
                    showToast(`成功导入 ${words.length} 个单词`);
                },
                (error) => {
                    showToast(error);
                }
            );
        });

        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
        document.getElementById('closeSettingsBtn').addEventListener('click', closeSettingsModal);
        document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

        // 导入模态框
        document.getElementById('closeImportBtn').addEventListener('click', closeImportModal);

        // 单词操作按钮
        document.getElementById('knownBtn').addEventListener('click', markAsKnown);
        document.getElementById('unknownBtn').addEventListener('click', markAsUnknown);
        document.getElementById('showMeaningBtn').addEventListener('click', toggleMeaning);
        document.getElementById('editWordBtn').addEventListener('click', openEditWordModal);

        // 编辑单词模态框
        document.getElementById('closeEditWordBtn').addEventListener('click', closeEditWordModal);
        document.getElementById('saveWordBtn').addEventListener('click', saveEditedWord);
        document.getElementById('deleteWordBtn').addEventListener('click', deleteCurrentWord);

        // 学习模式切换
        document.getElementById('flashcardModeBtn').addEventListener('click', () => switchLearningMode('flashcard'));
        document.getElementById('fillBlankModeBtn').addEventListener('click', () => switchLearningMode('fillBlank'));
        document.getElementById('spellingModeBtn').addEventListener('click', () => switchLearningMode('spelling'));

        // 填空模式检查按钮
        checkFillBlankBtn.addEventListener('click', checkFillBlankAnswer);
        fillBlankInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkFillBlankAnswer();
        });

        // 拼写模式检查按钮
        checkSpellingBtn.addEventListener('click', checkSpellingAnswer);
        spellingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkSpellingAnswer();
        });

        // 显示答案按钮
        revealAnswerBtn.addEventListener('click', revealAnswer);
    }

    // 打开设置模态框
    function openSettingsModal() {
        document.getElementById('dailyGoalInput').value = settings.dailyGoal;
        document.getElementById('reminderTimeInput').value = settings.reminderTime || '';
        document.getElementById('restDurationInput').value = settings.restDuration || 2;
        settingsModal.classList.remove('hidden');
    }

    // 关闭设置模态框
    function closeSettingsModal() {
        settingsModal.classList.add('hidden');
    }

    // 打开导入模态框
    function openImportModal() {
        document.getElementById('fileInput').value = '';
        importModal.classList.remove('hidden');
    }

    // 关闭导入模态框
    function closeImportModal() {
        importModal.classList.add('hidden');
    }

    // 打开编辑单词模态框
    function openEditWordModal() {
        if (wordsList.length === 0) return;
        
        const currentWord = wordsList[currentWordIndex];
        document.getElementById('editWordInput').value = currentWord.word;
        document.getElementById('editMeaningInput').value = currentWord.meaning;
        editWordModal.classList.remove('hidden');
    }

    // 关闭编辑单词模态框
    function closeEditWordModal() {
        editWordModal.classList.add('hidden');
    }

    // 保存编辑的单词
    function saveEditedWord() {
        const wordInput = document.getElementById('editWordInput').value.trim();
        const meaningInput = document.getElementById('editMeaningInput').value.trim();
        
        if (!wordInput || !meaningInput) {
            showToast('单词和释义不能为空');
            return;
        }
        
        wordsList[currentWordIndex] = {
            ...wordsList[currentWordIndex],
            word: wordInput,
            meaning: meaningInput
        };
        
        showCurrentWord();
        closeEditWordModal();
        showToast('单词已更新');
    }

    // 删除当前单词
    function deleteCurrentWord() {
        if (wordsList.length === 0) return;
        
        wordsList.splice(currentWordIndex, 1);
        
        if (wordsList.length === 0) {
            learningView.classList.add('hidden');
            welcomeView.classList.remove('hidden');
        } else {
            if (currentWordIndex >= wordsList.length) {
                currentWordIndex = 0;
            }
            showCurrentWord();
        }
        
        closeEditWordModal();
        showToast('单词已删除');
    }

    // 标记为认识
    function markAsKnown() {
        if (wordsList.length === 0) return;
        
        wordsList[currentWordIndex].known = true;
        wordsList[currentWordIndex].lastReviewed = new Date().toISOString();
        wordsList[currentWordIndex].reviewCount = (wordsList[currentWordIndex].reviewCount || 0) + 1;
        
        // 增加学习计数
        learnedToday++;
        saveProgress();
        updateProgressDisplay();
        
        // 检查是否达成目标
        const justAchieved = !goalAchieved && learnedToday >= dailyGoal;
        goalAchieved = learnedToday >= dailyGoal;
        
        // 如果刚达成目标，显示烟花效果
        if (justAchieved) {
            createFireworks();
            showToast('恭喜你达成今日学习目标！');
        }
        
        nextWord();
    }

    // 标记为不认识
    function markAsUnknown() {
        if (wordsList.length === 0) return;
        
        wordsList[currentWordIndex].known = false;
        wordsList[currentWordIndex].lastReviewed = new Date().toISOString();
        wordsList[currentWordIndex].reviewCount = (wordsList[currentWordIndex].reviewCount || 0) + 1;
        
        nextWord();
    }

    // 显示/隐藏释义
    function toggleMeaning() {
        meaningDisplay.classList.toggle('hidden');
    }

    // 切换到下一个单词
    function nextWord() {
        if (wordsList.length === 0) return;
        
        currentWordIndex = (currentWordIndex + 1) % wordsList.length;
        showCurrentWord();
    }

    // 切换学习模式
    function switchLearningMode(mode) {
        learningMode = mode;
        
        // 隐藏所有模式
        document.getElementById('flashcardMode').classList.add('hidden');
        document.getElementById('fillBlankMode').classList.add('hidden');
        document.getElementById('spellingMode').classList.add('hidden');
        
        // 移除所有活动模式类
        document.getElementById('flashcardModeBtn').classList.remove('active-mode');
        document.getElementById('fillBlankModeBtn').classList.remove('active-mode');
        document.getElementById('spellingModeBtn').classList.remove('active-mode');
        
        // 显示当前模式并添加活动类
        document.getElementById(`${mode}Mode`).classList.remove('hidden');
        document.getElementById(`${mode}ModeBtn`).classList.add('active-mode');
        
        showCurrentWord();
    }

    // 初始化应用
    initApp();
});
