// Modern admin selection app - с поддержкой ролей и тегов

// App configuration and state
const AppConfig = {
    // Реальные админы будут загружаться из бота - НЕТ ДЕМО-ДАННЫХ!
    admins: [],
    currentTab: 'available',
    selectedAdmin: null,
    isLoading: false,
    tg: window.Telegram?.WebApp
};

// Empty state configurations
const EmptyStates = {
    available: {
        title: "Нет доступных админов",
        description: "В данный момент все администраторы заняты. Попробуйте позже или отправьте сообщение - мы обязательно ответим!",
        icon: "😴"
    },
    unavailable: {
        title: "Все админы свободны", 
        description: "Отлично! Все наши администраторы сейчас готовы помочь вам. Перейдите во вкладку 'Доступные админы'.",
        icon: "🎉"
    }
};

// Utility functions
const Utils = {
    createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    },

    createRipple(element, event) {
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
    },

    showLoading(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
                <div style="color: rgba(255, 255, 255, 0.7);">Загрузка админов...</div>
            </div>
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Admin card creation with roles and tags
function createAdminCard(admin) {
    const statusClass = admin.status === 'available' ? 'available' : 'unavailable';
    const statusText = admin.status === 'available' ? 'Доступен' : 'Недоступен';
    const statusIcon = admin.status === 'available' ? '✅' : '🔴';
    const buttonDisabled = admin.status !== 'available' ? 'disabled' : '';
    const buttonText = admin.status === 'available' ? 'Связаться' : 'Недоступен';
    const buttonClass = admin.status === 'available' ? 'btn-primary' : 'btn-secondary';

    // Используем роль как описание если описание не задано
    const description = admin.description || admin.role || 'Администратор';
    const role = admin.role || 'Администратор';

    // Рейтинг
    const rating = admin.rating || 0;
    const ratingStars = rating > 0 ? `⭐${rating.toFixed(1)}` : '';

    const card = Utils.createElement('div', 'admin-card');
    card.dataset.adminTag = admin.tag;
    card.dataset.status = admin.status;

    card.innerHTML = `
        <div class="admin-header">
            <div class="admin-avatar">#</div>
            <div class="admin-info">
                <h3>#${Utils.escapeHtml(admin.tag)}</h3>
                <div class="admin-role">${Utils.escapeHtml(role)}</div>
                <p class="admin-desc">${Utils.escapeHtml(description)}</p>
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

    // Add click handler for available admins
    if (admin.status === 'available') {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            selectAdmin(admin);
        });

        // Add ripple effect
        card.addEventListener('click', (e) => {
            Utils.createRipple(card, e);
        });
    }

    return card;
}

// Empty state creation
function createEmptyState(type) {
    const config = EmptyStates[type];
    const emptyState = Utils.createElement('div', 'empty-state');

    emptyState.innerHTML = `
        <div class="empty-icon">${config.icon}</div>
        <h3 class="empty-title">${config.title}</h3>
        <p class="empty-description">${config.description}</p>
    `;

    return emptyState;
}

// Реальная загрузка данных из бота - БЕЗ ДЕМО!
async function loadAdminsData() {
    AppConfig.isLoading = true;

    try {
        // В реальной реализации здесь будет запрос к API бота
        console.log('🔄 Загрузка реальных админов из бота...');

        // Симуляция загрузки
        await new Promise(resolve => setTimeout(resolve, 800));

        // ВАЖНО: Здесь должен быть реальный API запрос к вашему боту
        // В реальной реализации данные будут приходить от бота через WebApp API
        // AppConfig.admins = await fetchAdminsFromBot();

        // Пока загружаем пустой список - админы добавляются командами бота
        AppConfig.admins = [];

        console.log('✅ Загрузка завершена. Админов:', AppConfig.admins.length);

    } catch (error) {
        console.error('❌ Ошибка загрузки админов:', error);
        AppConfig.admins = [];
    } finally {
        AppConfig.isLoading = false;
    }

    return AppConfig.admins;
}

// Render admins in containers
function renderAdmins() {
    const availableContainer = document.getElementById('available-admins');
    const unavailableContainer = document.getElementById('unavailable-admins');
    const availableEmpty = document.getElementById('available-empty');
    const unavailableEmpty = document.getElementById('unavailable-empty');

    // Очищаем контейнеры
    availableContainer.innerHTML = '';
    unavailableContainer.innerHTML = '';

    if (AppConfig.isLoading) {
        Utils.showLoading(availableContainer);
        Utils.showLoading(unavailableContainer);
        availableEmpty.style.display = 'none';
        unavailableEmpty.style.display = 'none';
        return;
    }

    // Filter admins by status
    const availableAdmins = AppConfig.admins.filter(admin => admin.status === 'available');
    const unavailableAdmins = AppConfig.admins.filter(admin => admin.status === 'unavailable');

    // Render available admins
    if (availableAdmins.length === 0) {
        availableContainer.innerHTML = '';
        availableEmpty.style.display = 'block';
    } else {
        availableEmpty.style.display = 'none';
        availableAdmins.forEach((admin, index) => {
            const card = createAdminCard(admin);
            // Stagger animation
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
            availableContainer.appendChild(card);
        });
    }

    // Render unavailable admins
    if (unavailableAdmins.length === 0) {
        unavailableContainer.innerHTML = '';
        unavailableEmpty.style.display = 'block';
    } else {
        unavailableEmpty.style.display = 'none';
        unavailableAdmins.forEach((admin, index) => {
            const card = createAdminCard(admin);
            // Stagger animation
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
            unavailableContainer.appendChild(card);
        });
    }
}

// Tab switching functionality
function switchTab(tabName) {
    if (AppConfig.currentTab === tabName) return;

    AppConfig.currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        const isActive = tab.dataset.tab === tabName;
        tab.classList.toggle('active', isActive);
    });

    // Update tab content with animation
    document.querySelectorAll('.tab-content').forEach(content => {
        const isActive = content.id === tabName;
        if (isActive) {
            content.classList.add('active');
            // Re-trigger animations for cards
            setTimeout(() => {
                content.querySelectorAll('.admin-card').forEach((card, index) => {
                    card.style.animationDelay = `${index * 0.05}s`;
                    card.classList.add('animate-in');
                });
            }, 100);
        } else {
            content.classList.remove('active');
        }
    });
}

// Admin selection
function selectAdmin(admin) {
    AppConfig.selectedAdmin = admin;
    showModal();
}

// Modal functionality
function showModal() {
    if (!AppConfig.selectedAdmin) return;

    const modal = document.getElementById('modal-overlay');
    const adminTag = document.getElementById('modal-admin-tag');
    const adminDesc = document.getElementById('modal-admin-desc');

    adminTag.textContent = `#${AppConfig.selectedAdmin.tag}`;

    // Показываем роль в модальном окне
    const role = AppConfig.selectedAdmin.role || 'Администратор';
    adminDesc.innerHTML = `
        <div class="modal-admin-role">${Utils.escapeHtml(role)}</div>
        <div class="modal-admin-desc">${Utils.escapeHtml(AppConfig.selectedAdmin.description || role)}</div>
    `;

    modal.classList.add('show');
}

function hideModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('show');
    AppConfig.selectedAdmin = null;
}

// Confirm admin selection
async function confirmSelection() {
    if (!AppConfig.selectedAdmin) return;

    const confirmBtn = document.getElementById('modal-confirm');
    const btnText = confirmBtn.querySelector('.btn-text');
    const btnLoading = confirmBtn.querySelector('.btn-loading');

    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    confirmBtn.disabled = true;

    try {
        // Prepare data for bot
        const data = {
            action: 'select_admin',
            admin_tag: AppConfig.selectedAdmin.tag
        };

        console.log('📤 Отправляем данные в бота:', data);

        // Send data to Telegram bot
        if (AppConfig.tg) {
            AppConfig.tg.sendData(JSON.stringify(data));
            AppConfig.tg.close();
        } else {
            // For testing in browser
            console.log('🧪 Тестовый режим - данные:', data);
            alert(`Выбран администратор:\n#${AppConfig.selectedAdmin.tag}\nРоль: ${AppConfig.selectedAdmin.role || 'Администратор'}\n\nВ реальном боте будет отправлен запрос.`);
        }

    } catch (error) {
        console.error('❌ Ошибка отправки данных:', error);
        alert('Ошибка при отправке запроса');
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        confirmBtn.disabled = false;
        hideModal();
    }
}

// Event handlers setup
function setupEventHandlers() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });

    // Modal controls
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

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('modal-overlay').classList.contains('show')) {
            hideModal();
        }
    });
}

// Telegram WebApp initialization
function initTelegramWebApp() {
    if (AppConfig.tg) {
        try {
            AppConfig.tg.expand();
            AppConfig.tg.ready();
            AppConfig.tg.setHeaderColor('#151729');
            AppConfig.tg.setBackgroundColor('#151729');

            // Handle theme changes
            AppConfig.tg.onEvent('themeChanged', () => {
                console.log('🎨 Theme changed:', AppConfig.tg.colorScheme);
            });

            console.log('📱 Telegram WebApp initialized');
        } catch (error) {
            console.error('❌ Telegram WebApp initialization failed:', error);
        }
    } else {
        console.log('🌐 Running in browser mode');
    }
}

// App initialization
async function initApp() {
    console.log('🚀 Initializing admin selection app...');
    console.log('⚠️  Демо-админы удалены - используются только реальные из бота!');
    console.log('🆕 Добавлена поддержка ролей и тегов админов');

    // Initialize Telegram WebApp
    initTelegramWebApp();

    // Setup event handlers
    setupEventHandlers();

    // Load and render data (no demo admins!)
    await loadAdminsData();
    renderAdmins();

    console.log('✅ App initialization complete - готов для реальных админов с ролями!');
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('App error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging
window.AdminApp = {
    config: AppConfig,
    utils: Utils,
    loadData: loadAdminsData,
    render: renderAdmins,
    switchTab: switchTab
};

// Функция для обновления админов (будет вызываться из бота)
window.updateAdmins = function(adminsList) {
    console.log('🔄 Получены новые админы с ролями:', adminsList);
    AppConfig.admins = adminsList || [];
    renderAdmins();
};
