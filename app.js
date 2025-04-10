let isTranslating = false;

async function handleTranslate() {
    if (isTranslating) return;
    
    const input = document.getElementById('inputText').value.trim();
    const from = document.getElementById('fromLang').value;
    const to = document.getElementById('toLang').value;
    const resultDiv = document.getElementById('result');
    const statusDiv = document.getElementById('status');

    // 输入验证
    if (!input) {
        showStatus('请输入要翻译的内容', 'error');
        return;
    }
    if (input.length > 2000) {
        showStatus('内容长度不能超过2000字', 'error');
        return;
    }

    try {
        isTranslating = true;
        showStatus('翻译中...', 'loading');
        
        const response = await fetch('https://api.render.com/deploy/srv-cvrt4p24d50c73d5i7kg?key=NXyuvG6sTRc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: input,
                from: from,
                to: to
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        resultDiv.innerHTML = data.translation;
        showStatus(`翻译完成（${data.from} → ${data.to}）`, 'success');
    } catch (error) {
        console.error('翻译失败:', error);
        resultDiv.innerHTML = '';
        showStatus(`翻译失败: ${error.message}`, 'error');
    } finally {
        isTranslating = false;
    }
}

function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status-info ${type}`;
    statusDiv.textContent = message;
    
    // 自动清除状态
    if (type !== 'loading') {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status-info';
        }, 3000);
    }
}

// 语言选择联动
document.getElementById('fromLang').addEventListener('change', function() {
    const toSelect = document.getElementById('toLang');
    if (this.value === toSelect.value) {
        toSelect.value = this.value === 'cn' ? 'en' : 'cn';
    }
});