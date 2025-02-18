// ==UserScript==
// @name         飞书收藏夹
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  收藏到飞书多维表格
// @author       You
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    // 添加 CSP meta 标签
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = 'upgrade-insecure-requests';
    document.head.appendChild(meta);

    // 修改样式，添加 tab 相关样式
    const style = document.createElement('style');
    style.textContent = `
        .feishu-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border-radius: 4px;
            width: 350px;
        }

        .tab-header {
            display: flex;
            border-bottom: 1px solid #ddd;
            background: #f5f5f5;
            border-radius: 4px 4px 0 0;
        }

        .tab-btn {
            padding: 12px 20px;
            border: none;
            background: none;
            cursor: pointer;
            flex: 1;
            font-size: 14px;
            color: #666;
            transition: all 0.3s;
        }

        .tab-btn.active {
            background: white;
            color: #4CAF50;
            font-weight: bold;
            box-shadow: inset 0 -2px 0 #4CAF50;
        }

        .tab-btn:hover:not(.active) {
            background: #eee;
        }

        .tab-content {
            padding: 15px;
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .note-category, .note-textarea, .config-input {
            width: 100%;
            margin-bottom: 15px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }

        .note-textarea {
            height: 150px;
            resize: vertical;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }

        .submit-btn {
            display: block;
            width: 100%;
            padding: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .submit-btn:hover {
            background: #45a049;
        }

        .result-message {
            margin-top: 10px;
            padding: 8px;
            border-radius: 4px;
            word-break: break-all;
        }

        .result-success {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .result-error {
            background: #ffebee;
            color: #c62828;
        }

        .help-text {
            color: #1E88E5;
            font-size: 12px;
            margin: -10px 0 15px 0;
            display: block;
            text-decoration: none;
        }
        .help-text:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(style);

    // 创建主面板
    const panel = document.createElement('div');
    panel.className = 'feishu-panel';
    panel.style.display = 'none';
    
    // 创建面板内容
    panel.innerHTML = `
        <div class="tab-header">
            <button class="tab-btn active" data-tab="collect">收藏</button>
            <button class="tab-btn" data-tab="settings">设置</button>
        </div>
        <div class="tab-content active" id="collect-tab">
            <label>分类</label>
            <input type="text" class="note-category" placeholder="请输入分类...">
            <label>描述*</label>
            <textarea class="note-textarea" placeholder="给我一个收藏的理由吧..."></textarea>
            <button class="submit-btn">提交</button>
            <div class="result-message" style="display: none;"></div>
        </div>
        <div class="tab-content" id="settings-tab">
            <label>服务器地址</label>
            <input type="text" class="config-input" id="server-url" value="${GM_getValue('serverUrl', 'http://localhost:8080')}" placeholder="请输入服务器地址...">
            
            <label>App ID</label>
            <input type="text" class="config-input" id="app-id" value="${GM_getValue('appId', '')}" placeholder="请输入 App ID...">
            <a href="https://open.feishu.cn/app" target="_blank" class="help-text">点击这里获取</a>
            <label>App Secret</label>
            <div style="position: relative; display: flex; align-items: center;">
                <input type="password" class="config-input" id="app-secret" value="${GM_getValue('appSecret', '')}" placeholder="请输入 App Secret...">
                <button class="toggle-password" style="background: none; border: none; cursor: pointer; padding: 5px; margin-left: -30px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </div>
            <label>App Token</label>
            <input type="text" class="config-input" id="app-token" value="${GM_getValue('appToken', '')}" placeholder="请输入飞书多维表格的 App Token...">
            <div class="help-text">查看浏览器地址栏的多维表格url，base部分</div>
            <label>Table ID</label>
            <input type="text" class="config-input" id="table-id" value="${GM_getValue('tableId', '')}" placeholder="请输入数据表 ID...">
            <div class="help-text">查看浏览器地址栏的多维表格url，table部分</div>
            <button class="submit-btn">保存配置</button>
            <div class="result-message" style="display: none;"></div>
        </div>
    `;
    document.body.appendChild(panel);

    // 创建触发按钮
    const btn = document.createElement('button');
    btn.className = 'submit-btn';
    btn.style = `
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        width: auto;
        z-index: 9998;
        opacity: 0.6;
        transition: opacity 0.3s;
    `;
    btn.textContent = '收藏';
    document.body.appendChild(btn);

    // 添加鼠标悬停效果
    btn.addEventListener('mouseenter', () => {
        btn.style.opacity = '1';
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.opacity = '0.6';
    });

    // 添加点击空白处隐藏面板的功能
    document.addEventListener('click', (event) => {
        // 检查点击是否在面板或触发按钮之外
        if (!panel.contains(event.target) && event.target !== btn) {
            panel.style.display = 'none';
        }
    });

    // 防止点击面板内部时触发document的点击事件
    panel.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // 防止点击按钮时触发document的点击事件
    btn.addEventListener('click', (event) => {
        event.stopPropagation();
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    // 绑定 tab 切换事件
    panel.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            // 更新按钮状态
            panel.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 更新内容显示
            panel.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            panel.querySelector(`#${button.dataset.tab}-tab`).classList.add('active');
            
            // 清除所有结果消息
            panel.querySelectorAll('.result-message').forEach(msg => msg.style.display = 'none');
        });
    });

    // 绑定收藏提交事件
    panel.querySelector('#collect-tab .submit-btn').addEventListener('click', async () => {
        const content = panel.querySelector('#collect-tab .note-textarea').value;
        const category = panel.querySelector('#collect-tab .note-category').value;

        if (!content.trim()) {
            showResult('请输入内容', true);
            return;
        }

        try {
            const currentServerUrl = GM_getValue('serverUrl', 'http://localhost:8080');
            const currentAppToken = GM_getValue('appToken', '');
            const currentAppId = GM_getValue('appId', '');
            const currentAppSecret = GM_getValue('appSecret', '');
            const currentTableId = GM_getValue('tableId', '');

            if (!currentAppToken || !currentTableId || !currentAppId || !currentAppSecret) {
                showResult('请先在设置中完成所有配置', true);
                return;
            }

            const response = await fetch(`${currentServerUrl}/add`, {
                
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "url": window.location.href,
                    "content": content,
                    "category": category,
                    "app_token": currentAppToken,
                    "table_id": currentTableId,
                    "app_id": currentAppId,
                    "app_secret": currentAppSecret,
                })
            });

            const result = await response.text();
            showResult("提交成功" + result);
            panel.querySelector('#collect-tab .note-textarea').value = '';
            panel.querySelector('#collect-tab .note-category').value = '';
        } catch (error) {
            showResult('提交失败：' + error.message, true);
        }
    });

    // 绑定配置保存事件
    panel.querySelector('#settings-tab .submit-btn').addEventListener('click', () => {
        const newServerUrl = panel.querySelector('#settings-tab .config-input#server-url').value.trim();
        const newAppToken = panel.querySelector('#settings-tab .config-input#app-token').value.trim();
        const newAppId = panel.querySelector('#settings-tab .config-input#app-id').value.trim();
        const newAppSecret = panel.querySelector('#settings-tab .config-input#app-secret').value.trim();
        const newTableId = panel.querySelector('#settings-tab .config-input#table-id').value.trim();

        if (!newServerUrl) {
            showResult('请输入服务器地址', true);
            return;
        }

        if (!newAppToken) {
            showResult('请输入 App Token', true);
            return;
        }

        if (!newAppId) {
            showResult('请输入 App ID', true);
            return;
        }

        if (!newAppSecret) {
            showResult('请输入 App Secret', true);
            return;
        }

        if (!newTableId) {
            showResult('请输入 Table ID', true);
            return;
        }

        GM_setValue('serverUrl', newServerUrl);
        GM_setValue('appToken', newAppToken);
        GM_setValue('appId', newAppId);
        GM_setValue('appSecret', newAppSecret);
        GM_setValue('tableId', newTableId);
        
        showResult('配置已保存');
        setTimeout(() => {
            panel.style.display = 'none';
        }, 1500);
    });

    // 添加密码显示切换功能
    const togglePassword = panel.querySelector('.toggle-password');
    const passwordInput = panel.querySelector('#app-secret');
    
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // 切换眼睛图标
        const eyeOpen = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>`;
        
        const eyeClosed = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>`;
        
        togglePassword.innerHTML = type === 'password' ? eyeOpen : eyeClosed;
    });

    // 显示结果消息
    function showResult(message, isError = false) {
        const resultDiv = document.querySelector('.result-message');
        resultDiv.textContent = message;
        resultDiv.className = 'result-message ' + (isError ? 'result-error' : 'result-success');
        resultDiv.style.display = 'block';
    }
})();