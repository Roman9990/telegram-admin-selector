// ПОЛНЫЙ КОД JAVASCRIPT С API ИНТЕГРАЦИЕЙ
// Версия: Финальная с полной интеграцией бота

const AdminApp = {
    admins: [],
    currentTab: 'available',
    selectedAdmin: null,
    tg: window.Telegram?.WebApp,
    API_BASE_URL: 'http://localhost:8080/api'  // URL бота API
};

// ======================== УТИЛИТЫ ========================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(container, message = 'Загрузка...') {
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
                <div style="color: rgba(255, 255, 255, 0.7);">${message}</div>
            </div>
        `;
    }
}

function createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
}

// ======================== СОЗДАНИЕ КАРТОЧЕК АДМИНОВ ========================

function createAdminCard(admin) {
    const statusClass = admin.status === 'available' ? 'available' : 'unavailable';
    const statusText = admin.status === 'available' ? 'Доступен' : 'Недоступен';
    const statusIcon = admin.status === 'available' ? '✅' : '🔴';
    const buttonDisabled = admin.status !== 'available' ? 'disabled' : '';
    const buttonText = admin.status === 'available' ? 'Связаться' : 'Недоступен';
    const buttonClass = admin.status === 'available' ? 'btn-primary' : 'btn-secondary';
    
    const role = admin.role || 'Администратор';
    const description = admin.description || role;
    const rating = admin.rating || 0;
    const ratingStars = rating > 0 ? `⭐${rating.toFixed(1)}` : '';
    
    const card = createElement('div', 'admin-card');
    card.dataset.adminTag = admin.tag;
    card.dataset.status = admin.status;
    
    card.innerHTML = `
        <div class="admin-header">
            <div class="admin-avatar">#</div>
            <div class="admin-info">
                <h3>#${escapeHtml(admin.tag)}</h3>
                <div class="admin-role">${escapeHtml(role)}</div>
                <p class="admin-desc">${escapeHtml(description)}</p>
                ${rating > 0 ? `<div class="admin-rating">${ratingStars}</div>` : ''}
            </div>
        </div>
        
        <div class="admin-status ${statusClass}">
            <span>${statusIcon}</span>
            <span>${statusText}</span>
        </div>
        
        <button class="btn ${buttonClass}" ${buttonDisabled}>
            ${buttonText}
        </button>
    `;
    
    // Добавляем обработчик клика для доступных админов
    if (admin.status === 'available') {
        card.addEventListener('click', () => selectAdmin(admin));
        
        // Эффект ripple при клике
        card.addEventListener('click', (e) => {
            createRippleEffect(card, e);
        });
    }
    
    return card;
}

function createRippleEffect(element, event) {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const ripple = document.createElement('div');
    ripple.className = 'btn-ripple';
    ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: translate(-50%, -50%);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.remove();
        }
    }, 600);
}

// ======================== API ЗАГРУЗКА АДМИНОВ ========================

async function loadAdminsFromBot() {
    console.log('🔄 ЗАГРУЗКА РЕАЛЬНЫХ АДМИНОВ ЧЕРЕЗ API БОТА');
    
    try {
        // Загружаем админов через API бота
        const response = await fetch(`${AdminApp.API_BASE_URL}/admins`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.admins)) {
            AdminApp.admins = data.admins;
            console.log(`✅ Загружено ${data.admins.length} реальных админов из бота!`);
            
            // Выводим информацию о каждом админе
            data.admins.forEach(admin => {
                console.log(`  - #${admin.tag}: ${admin.role} (${admin.status})`);
            });
            
            return data.admins;
        } else {
            throw new Error('Неверный формат ответа от API');
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных из бота:', error);
        
        // Если API недоступен, показываем сообщение
        AdminApp.admins = [];
        
        // Показываем информацию об ошибке в интерфейсе
        showConnectionError(error.message);
        
        return [];
    }
}

function showConnectionError(errorMessage) {
    const availableContainer = document.getElementById('available-admins');
    const unavailableContainer = document.getElementById('unavailable-admins');
    
    const errorHtml = `
        <div style="text-align: center; padding: 2rem; background: rgba(255, 0, 0, 0.1); border-radius: 10px; margin: 1rem;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
            <h3 style="color: #ff6b6b; margin-bottom: 1rem;">Ошибка подключения к боту</h3>
            <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem;">
                Не удалось загрузить список администраторов
            </p>
            <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                ${errorMessage}
            </p>
            <button class="btn btn-primary" onclick="loadAdmins()" style="margin-top: 1rem;">
                🔄 Повторить попытку
            </button>
        </div>
    `;
    
    if (availableContainer) availableContainer.innerHTML = errorHtml;
    if (unavailableContainer) unavailableContainer.innerHTML = '';
}

// ======================== ЗАГРУЗКА И ОТОБРАЖЕНИЕ ========================

async function loadAdmins() {
    const availableContainer = document.getElementById('available-admins');
    const unavailableContainer = document.getElementById('unavailable-admins');
    const availableEmpty = document.getElementById('available-empty');
    const unavailableEmpty = document.getElementById('unavailable-empty');
    
    // Показываем состояние загрузки
    showLoading(availableContainer, 'Загрузка админов из бота...');
    showLoading(unavailableContainer, 'Загрузка админов из бота...');
    
    if (availableEmpty) availableEmpty.style.display = 'none';
    if (unavailableEmpty) unavailableEmpty.style.display = 'none';
    
    // Загружаем реальных админов из бота
    await loadAdminsFromBot();
    
    // Отображаем результат
    renderAdmins();
}

function renderAdmins() {
    const availableContainer = document.getElementById('available-admins');
    const unavailableContainer = document.getElementById('unavailable-admins');
    const availableEmpty = document.getElementById('available-empty');
    const unavailableEmpty = document.getElementById('unavailable-empty');
    
    // Очищаем контейнеры
    if (availableContainer) availableContainer.innerHTML = '';
    if (unavailableContainer) unavailableContainer.innerHTML = '';
    
    // Фильтруем админов по статусу
    const availableAdmins = AdminApp.admins.filter(admin => admin.status === 'available');
    const unavailableAdmins = AdminApp.admins.filter(admin => admin.status === 'unavailable');
    
    // Отображаем доступных админов
    if (availableAdmins.length === 0) {
        if (availableEmpty) {
            availableEmpty.style.display = 'block';
            
            // Обновляем сообщение в зависимости от того, есть ли админы вообще
            const emptyTitle = availableEmpty.querySelector('.empty-title');
            const emptyDesc = availableEmpty.querySelector('.empty-description');
            
            if (AdminApp.admins.length === 0) {
                if (emptyTitle) emptyTitle.textContent = 'Нет админов в базе';
                if (emptyDesc) emptyDesc.textContent = 'Администраторы еще не добавлены. Используйте команду /add_admin в боте.';
            } else {
                if (emptyTitle) emptyTitle.textContent = 'Все админы заняты';
                if (emptyDesc) emptyDesc.textContent = 'В данный момент все администраторы недоступны. Попробуйте позже.';
            }
        }
    } else {
        if (availableEmpty) availableEmpty.style.display = 'none';
        
        availableAdmins.forEach((admin, index) => {
            const card = createAdminCard(admin);
            // Анимация появления с задержкой
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
            if (availableContainer) availableContainer.appendChild(card);
        });
    }
    
    // Отображаем недоступных админов
    if (unavailableAdmins.length === 0) {
        if (unavailableEmpty) unavailableEmpty.style.display = 'block';
    } else {
        if (unavailableEmpty) unavailableEmpty.style.display = 'none';
        
        unavailableAdmins.forEach((admin, index) => {
            const card = createAdminCard(admin);
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
            if (unavailableContainer) unavailableContainer.appendChild(card);
        });
    }
    
    console.log(`📊 Отображено: ${availableAdmins.length} доступных, ${unavailableAdmins.length} недоступных`);
}

// ======================== НАВИГАЦИЯ ПО ВКЛАДКАМ ========================

function switchTab(tabName) {
    if (AdminApp.currentTab === tabName) return;
    
    AdminApp.currentTab = tabName;
    
    // Обновляем кнопки вкладок
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Обновляем содержимое вкладок
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    // Обновляем анимации карточек
    setTimeout(() => {
        const activeContent = document.getElementById(tabName);
        if (activeContent) {
            activeContent.querySelectorAll('.admin-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
                card.classList.add('animate-in');
            });
        }
    }, 100);
}

// ======================== МОДАЛЬНЫЕ ОКНА ========================

function selectAdmin(admin) {
    AdminApp.selectedAdmin = admin;
    showModal();
}

function showModal() {
    if (!AdminApp.selectedAdmin) return;
    
    const modal = document.getElementById('modal-overlay');
    const adminTag = document.getElementById('modal-admin-tag');
    const adminDesc = document.getElementById('modal-admin-desc');
    
    if (adminTag) {
        adminTag.textContent = `#${AdminApp.selectedAdmin.tag}`;
    }
    
    if (adminDesc) {
        const role = AdminApp.selectedAdmin.role || 'Администратор';
        const description = AdminApp.selectedAdmin.description || role;
        
        adminDesc.innerHTML = `
            <div class="modal-admin-role">${escapeHtml(role)}</div>
            <div class="modal-admin-desc">${escapeHtml(description)}</div>
        `;
    }
    
    if (modal) {
        modal.classList.add('show');
    }
}

function hideModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.classList.remove('show');
    }
    AdminApp.selectedAdmin = null;
}

// ======================== ОТПРАВКА ЗАПРОСА АДМИНУ ========================

async function confirmSelection() {
    if (!AdminApp.selectedAdmin) return;
    
    const confirmBtn = document.getElementById('modal-confirm');
    const btnText = confirmBtn?.querySelector('.btn-text');
    const btnLoading = confirmBtn?.querySelector('.btn-loading');
    
    // Показываем состояние загрузки
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    if (confirmBtn) confirmBtn.disabled = true;
    
    try {
        console.log('📤 Отправляем запрос админу через API бота');
        
        // Отправляем через Telegram WebApp API (приоритет)
        if (AdminApp.tg && AdminApp.tg.sendData) {
            const webAppData = {
                action: 'select_admin',
                admin_tag: AdminApp.selectedAdmin.tag
            };
            
            console.log('📱 Отправка через Telegram WebApp:', webAppData);
            AdminApp.tg.sendData(JSON.stringify(webAppData));
            
            // Закрываем WebApp
            setTimeout(() => {
                if (AdminApp.tg.close) {
                    AdminApp.tg.close();
                }
            }, 1000);
            
            return;
        }
        
        // Альтернативно отправляем через HTTP API
        const requestData = {
            admin_tag: AdminApp.selectedAdmin.tag,
            user_data: AdminApp.tg ? AdminApp.tg.initDataUnsafe?.user : {
                id: Date.now(),
                first_name: 'Пользователь сайта'
            }
        };
        
        const response = await fetch(`${AdminApp.API_BASE_URL}/select-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ ${result.message}\\nАдминистратор уведомлен!`);
        } else {
            alert(`❌ Ошибка: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка отправки запроса:', error);
        alert('❌ Ошибка при отправке запроса. Проверьте подключение к боту.');
    } finally {
        // Возвращаем кнопку в исходное состояние
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (confirmBtn) confirmBtn.disabled = false;
        hideModal();
    }
}

// ======================== ОБРАБОТЧИКИ СОБЫТИЙ ========================

function setupEventHandlers() {
    // Переключение вкладок
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tab.dataset.tab);
        });
    });
    
    // Модальное окно
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    
    if (modalCancel) {
        modalCancel.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal();
        });
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hideModal();
            }
        });
    }
    
    if (modalConfirm) {
        modalConfirm.addEventListener('click', (e) => {
            e.preventDefault();
            confirmSelection();
        });
    }
    
    // Клавиша Escape для закрытия модального окна
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideModal();
        }
    });
    
    // Кнопка обновления (если есть)
    const refreshBtn = document.getElementById('refresh-admins');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('🔄 Обновление списка админов...');
            await loadAdmins();
        });
    }
}

// ======================== TELEGRAM WEBAPP ========================

function initTelegramWebApp() {
    if (AdminApp.tg) {
        try {
            AdminApp.tg.expand();
            AdminApp.tg.ready();
            
            // Настройка темы
            AdminApp.tg.setHeaderColor('#151729');
            AdminApp.tg.setBackgroundColor('#151729');
            
            // Обработчики событий WebApp
            AdminApp.tg.onEvent('themeChanged', () => {
                console.log('🎨 Тема изменена:', AdminApp.tg.colorScheme);
            });
            
            AdminApp.tg.onEvent('viewportChanged', () => {
                console.log('📱 Viewport изменен:', AdminApp.tg.viewportHeight);
            });
            
            console.log('📱 Telegram WebApp инициализирован');
            console.log('👤 Пользователь:', AdminApp.tg.initDataUnsafe?.user);
            
        } catch (error) {
            console.error('❌ Ошибка инициализации WebApp:', error);
        }
    } else {
        console.log('🌐 Запуск в браузере - WebApp недоступен');
    }
}

// ======================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ========================

async function initApp() {
    console.log('🚀 Инициализация приложения с ПОЛНОЙ интеграцией бота');
    console.log('🔗 API бота:', AdminApp.API_BASE_URL);
    console.log('🌐 WebApp URL:', window.location.href);
    
    // Инициализация Telegram WebApp
    initTelegramWebApp();
    
    // Настройка обработчиков событий
    setupEventHandlers();
    
    // Загружаем реальных админов из бота
    await loadAdmins();
    
    console.log('✅ Приложение готово к работе с реальными админами!');
    
    // Логируем финальное состояние
    console.log(`📊 Итого админов: ${AdminApp.admins.length}`);
    console.log(`📱 Telegram WebApp: ${AdminApp.tg ? 'Доступен' : 'Недоступен'}`);
}

// ======================== ОБРАБОТКА ОШИБОК ========================

window.addEventListener('error', (e) => {
    console.error('❌ Ошибка приложения:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Необработанное отклонение промиса:', e.reason);
    e.preventDefault();
});

// ======================== ЭКСПОРТ ДЛЯ ОТЛАДКИ ========================

// Функция для внешнего обновления админов
window.updateAdmins = function(adminsList) {
    console.log('🔄 Внешнее обновление админов:', adminsList);
    AdminApp.admins = adminsList || [];
    renderAdmins();
};

// Экспорт объектов для отладки в консоли
window.AdminApp = AdminApp;
window.loadAdmins = loadAdmins;
window.renderAdmins = renderAdmins;
window.switchTab = switchTab;

// ======================== ЗАПУСК ПРИЛОЖЕНИЯ ========================

// Запуск при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Дополнительная проверка через 1 секунду (на случай медленной загрузки)
setTimeout(() => {
    if (AdminApp.admins.length === 0) {
        console.log('⏰ Повторная попытка загрузки админов через 1 секунду...');
        loadAdmins();
    }
}, 1000);
