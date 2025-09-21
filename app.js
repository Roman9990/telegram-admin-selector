// ПРЯМАЯ ИНТЕГРАЦИЯ С GITHUB - БЕЗ API БОТА

const AdminApp = {
    admins: [],
    currentTab: 'available',
    selectedAdmin: null,
    tg: window.Telegram?.WebApp,
    GITHUB_API_URL: 'https://api.github.com/repos/roman9990/telegram-admin-selector/contents/admins.json'
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
    }

    return card;
}

// ======================== ЗАГРУЗКА АДМИНОВ НАПРЯМУЮ С GITHUB ========================

async function loadAdminsFromGitHub() {
    console.log('🔄 ПРЯМАЯ ЗАГРУЗКА АДМИНОВ С GITHUB');

    try {
        // Загружаем файл admins.json с GitHub
        const response = await fetch(AdminApp.GITHUB_API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3.raw'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && Array.isArray(data.admins)) {
            AdminApp.admins = data.admins;
            console.log(`✅ Загружено ${data.admins.length} админов напрямую с GitHub!`);
            console.log(`📅 Последнее обновление: ${data.last_updated}`);

            // Выводим информацию о каждом админе
            data.admins.forEach(admin => {
                console.log(`  - #${admin.tag}: ${admin.role} (${admin.status})`);
            });

            return data.admins;
        } else {
            throw new Error('Неверный формат файла админов');
        }

    } catch (error) {
        console.error('❌ Ошибка загрузки админов с GitHub:', error);

        // Если GitHub недоступен, используем fallback
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
            <h3 style="color: #ff6b6b; margin-bottom: 1rem;">Ошибка загрузки админов</h3>
            <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem;">
                Не удалось загрузить список администраторов с GitHub
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
    showLoading(availableContainer, 'Загрузка админов напрямую с GitHub...');
    showLoading(unavailableContainer, 'Загрузка админов напрямую с GitHub...');

    if (availableEmpty) availableEmpty.style.display = 'none';
    if (unavailableEmpty) unavailableEmpty.style.display = 'none';

    // Загружаем админов напрямую с GitHub
    await loadAdminsFromGitHub();

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

            const emptyTitle = availableEmpty.querySelector('.empty-title');
            const emptyDesc = availableEmpty.querySelector('.empty-description');

            if (AdminApp.admins.length === 0) {
                if (emptyTitle) emptyTitle.textContent = 'Нет админов';
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

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
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

    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    if (confirmBtn) confirmBtn.disabled = true;

    try {
        console.log('📤 Отправляем запрос админу через Telegram WebApp');

        // Отправляем через Telegram WebApp API
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

        // Если WebApp недоступен, показываем инструкцию
        alert(`✅ Выбран администратор #${AdminApp.selectedAdmin.tag}\n\nДля отправки запроса откройте приложение через Telegram бота.`);

    } catch (error) {
        console.error('❌ Ошибка отправки запроса:', error);
        alert('❌ Ошибка при отправке запроса. Откройте приложение через Telegram бота.');
    } finally {
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
            if (e.target === modalOverlay) hideModal();
        });
    }

    if (modalConfirm) {
        modalConfirm.addEventListener('click', (e) => {
            e.preventDefault();
            confirmSelection();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideModal();
    });

    // Кнопка обновления
    const refreshBtn = document.getElementById('refresh-admins');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('🔄 Обновление админов с GitHub...');
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
            AdminApp.tg.setHeaderColor('#151729');
            AdminApp.tg.setBackgroundColor('#151729');

            console.log('📱 Telegram WebApp инициализирован');
            console.log('👤 Пользователь:', AdminApp.tg.initDataUnsafe?.user);

        } catch (error) {
            console.error('❌ Ошибка инициализации WebApp:', error);
        }
    } else {
        console.log('🌐 Запуск в браузере');
    }
}

// ======================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ========================

async function initApp() {
    console.log('🚀 Инициализация с ПРЯМОЙ ИНТЕГРАЦИЕЙ GITHUB');
    console.log('🔗 GitHub API:', AdminApp.GITHUB_API_URL);
    console.log('🌐 Админы загружаются напрямую с GitHub!');

    initTelegramWebApp();
    setupEventHandlers();

    // Загружаем админов с GitHub
    await loadAdmins();

    console.log('✅ Приложение готово! Прямая интеграция активна.');
}

// ======================== ЭКСПОРТ ДЛЯ ОТЛАДКИ ========================

window.updateAdmins = function(adminsList) {
    AdminApp.admins = adminsList || [];
    renderAdmins();
};

window.AdminApp = AdminApp;
window.loadAdmins = loadAdmins;

// ======================== ЗАПУСК ПРИЛОЖЕНИЯ ========================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Обновляем админов каждые 30 секунд
setInterval(() => {
    console.log('🔄 Автоматическое обновление с GitHub...');
    loadAdmins();
}, 30000);
