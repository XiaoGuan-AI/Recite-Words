
// custom_vocabulary_master/frontend/js/fileHandler.js
/**
 * 文件处理工具 - 负责解析用户上传的单词本文件
 * 增强版：增加更严格的格式验证和错误处理
 */

class FileHandler {
    /**
     * 解析词汇文件内容
     * @param {File} file - 用户上传的文件对象
     * @param {Function} onSuccess - 解析成功回调
     * @param {Function} onError - 解析失败回调
     */
    static parseVocabularyFile(file, onSuccess, onError) {
        if (!file) {
            onError('请选择有效的文件');
            return;
        }

        // 增强文件类型验证
        const validTypes = ['text/plain', 'text/csv', 'application/vnd.ms-excel'];
        const fileType = file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(file.type) && fileType !== 'txt' && fileType !== 'csv') {
            onError('仅支持TXT或CSV格式的文件');
            return;
        }

        // 增强文件大小限制 (最大5MB)
        if (file.size > 5 * 1024 * 1024) {
            onError('文件大小不能超过5MB');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const content = event.target.result;
                if (!content || content.trim().length === 0) {
                    onError('文件内容为空');
                    return;
                }

                const wordsList = FileHandler.processFileContent(content, fileType);
                
                if (wordsList.length === 0) {
                    onError('未找到有效单词数据，请检查文件格式');
                } else {
                    onSuccess(wordsList);
                }
            } catch (error) {
                console.error('文件解析错误:', error);
                onError(`解析失败: ${error.message}`);
            }
        };
        
        reader.onerror = function() {
            onError('文件读取失败，请重试');
        };
        
        reader.readAsText(file, 'UTF-8');
    }
    
    /**
     * 处理文件内容，解析成单词列表
     * @param {string} content - 文件内容
     * @param {string} fileType - 文件类型
     * @returns {Array} 解析后的单词列表
     */
    static processFileContent(content, fileType) {
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        const wordsList = [];
        const seenWords = new Set();
        
        for (let line of lines) {
            try {
                line = line.trim();
                if (!line || line.startsWith('#')) continue;
                
                let word, meaning;
                
                if (fileType === 'csv') {
                    // 增强CSV解析：处理带引号和转义字符的情况
                    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                    if (parts && parts.length >= 2) {
                        word = parts[0].replace(/^"|"$/g, '').trim();
                        meaning = parts[1].replace(/^"|"$/g, '').trim();
                    }
                } else {
                    // 增强TXT解析：支持多种分隔符
                    const separators = [',', '\t', ' - ', ':', '|', '=>'];
                    let parts;
                    
                    for (const sep of separators) {
                        if (line.includes(sep)) {
                            parts = line.split(sep);
                            break;
                        }
                    }
                    
                    if (!parts) {
                        // 最后尝试按空格分割
                        parts = line.split(/\s+/);
                    }
                    
                    if (parts && parts.length >= 2) {
                        word = parts[0].trim();
                        meaning = parts.slice(1).join(' ').trim();
                    }
                }
                
                // 验证单词和释义有效性
                if (word && meaning && !seenWords.has(word.toLowerCase())) {
                    if (word.length > 50 || meaning.length > 200) {
                        console.warn(`跳过过长条目: ${word}`);
                        continue;
                    }
                    
                    wordsList.push({
                        word,
                        meaning,
                        known: false,
                        lastReviewed: null,
                        reviewCount: 0
                    });
                    seenWords.add(word.toLowerCase());
                }
            } catch (e) {
                console.warn(`解析行时出错: ${line}`, e);
            }
        }
        
        return wordsList;
    }
    
    /**
     * 导出单词列表为CSV文件
     * @param {Array} wordsList - 单词列表
     * @param {string} filename - 导出的文件名
     */
    static exportToCSV(wordsList, filename = 'vocabulary.csv') {
        if (!wordsList || !Array.isArray(wordsList) || wordsList.length === 0) {
            console.error('无效的单词列表');
            return false;
        }
        
        try {
            let csvContent = 'word,meaning,known,reviewCount,lastReviewed\n';
            
            wordsList.forEach(item => {
                const escapedWord = `"${item.word.replace(/"/g, '""')}"`;
                const escapedMeaning = `"${item.meaning.replace(/"/g, '""')}"`;
                const known = item.known ? 'true' : 'false';
                const reviewCount = item.reviewCount || 0;
                const lastReviewed = item.lastReviewed || '';
                
                csvContent += `${escapedWord},${escapedMeaning},${known},${reviewCount},${lastReviewed}\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            
            // 延迟释放URL对象
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            return true;
        } catch (error) {
            console.error('导出CSV失败:', error);
            return false;
        }
    }
    
    /**
     * 生成示例单词列表
     * @returns {Array} 示例单词列表
     */
    static generateSampleWordsList() {
        return [
            { word: 'apple', meaning: '苹果', known: false, reviewCount: 0 },
            { word: 'book', meaning: '书', known: false, reviewCount: 0 },
            { word: 'computer', meaning: '电脑', known: false, reviewCount: 0 },
            { word: 'diligent', meaning: '勤奋的', known: false, reviewCount: 0 },
            { word: 'example', meaning: '例子', known: false, reviewCount: 0 },
            { word: 'friendly', meaning: '友好的', known: false, reviewCount: 0 },
            { word: 'grateful', meaning: '感激的', known: false, reviewCount: 0 },
            { word: 'honest', meaning: '诚实的', known: false, reviewCount: 0 },
            { word: 'important', meaning: '重要的', known: false, reviewCount: 0 },
            { word: 'journey', meaning: '旅行', known: false, reviewCount: 0 }
        ];
    }
}
