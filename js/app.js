// ==========================================
// 1. ЕДИНЫЙ ГЛАВНЫЙ СЛУШАТЕЛЬ СОБЫТИЙ И КЛИКОВ (DOM)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Конвейер параллельной загрузки новостей, проектов и маркетплейса
    Promise.all([loadNews(), loadProjectsPage(), buildGameTemplatePage(), loadMarketplacePage()])
        .then(() => { 
            if (typeof initFiltersAndSearch === 'function') initFiltersAndSearch(); 
            if (typeof initMarketplaceFilters === 'function') initMarketplaceFilters();
        })
        .catch(err => console.error("Ошибка загрузки модулей сайта:", err));

    // 2. Отрисовка всех шапок, профилей и виджетов при заходе на страницу
    if (typeof updateHeaderProfile === 'function') updateHeaderProfile();
    if (typeof buildProfilePage === 'function') buildProfilePage();
    if (typeof buildMainSideProfile === 'function') buildMainSideProfile();
    if (typeof applyAvatarBorderColor === 'function') applyAvatarBorderColor();

    // 3. Логика нативной рекламы Kristall Partners (Рекламная система сообщества)
    const btnPromo = document.getElementById('btn-promo-ad');
    if (btnPromo) {
        btnPromo.addEventListener('click', () => {
            if (!currentUser) {
                showKristallToast("Логин заблокирован! Войдите в Kristall ID.", "🔒");
                return;
            }
            const now = Date.now();
            const lastAdClaim = currentUser.last_ad_claim || 0;

            if (now - lastAdClaim < 86400000) {
                const hoursLeft = Math.ceil((86400000 - (now - lastAdClaim)) / 3600000);
                showKristallToast(`Награда уже получена! Перезарядка через ${hoursLeft} ч.`, "⏳");
                return;
            }

            currentUser.balance += 8; // +8 монет за лояльность
            currentUser.last_ad_claim = now;
            localStorage.setItem('kristall_user', JSON.stringify(currentUser));
            
            showKristallToast("Спасибо за поддержку партнёров! +8 монет.", "📺");
            if (typeof buildMainSideProfile === 'function') buildMainSideProfile(); 
            if (typeof updateHeaderProfile === 'function') updateHeaderProfile();
            
            // Открываем канал друга
            window.open("https://youtube.com/@pixellog33?si=eX1Vk56NRqe4GPXh", "_blank"); 
        });
    }

    // 4. Логика ежедневного бонуса профиля (Раз в 24 часа)
    const btnDaily = document.getElementById('btn-daily-bonus');
    if (btnDaily) {
        btnDaily.addEventListener('click', () => {
            if (!currentUser) return;
            const now = Date.now();
            const lastClaim = currentUser.last_daily_claim || 0;

            if (now - lastClaim < 86400000) {
                const hoursLeft = Math.ceil((86400000 - (now - lastClaim)) / 3600000);
                showKristallToast(`Бонус еще не перезарядился! Осталось ${hoursLeft} ч.`, "⏳");
                return;
            }

            currentUser.balance += 5; // +5 честных монет
            currentUser.last_daily_claim = now;
            if (typeof addPlayerXp === 'function') addPlayerXp(5); // +5 опыта
            
            localStorage.setItem('kristall_user', JSON.stringify(currentUser));
            showKristallToast("Ежедневный бонус получен! +5 монет, +5 XP.", "📆");
            if (typeof buildProfilePage === 'function') buildProfilePage();
        });
    }
    // 5. Логика сундука удачи профиля (Раз в 1 час)
    const btnChest = document.getElementById('btn-lucky-chest');
    if (btnChest) {
        btnChest.addEventListener('click', () => {
            if (!currentUser) return;
            const now = Date.now();
            const lastChest = currentUser.last_chest_claim || 0;

            if (now - lastChest < 3600000) {
                const minsLeft = Math.ceil((3600000 - (now - lastChest)) / 60000);
                showKristallToast(`Сундук пуст! До открытия осталось ${minsLeft} мин.`, "⏳");
                return;
            }

            const coinWin = Math.floor(Math.random() * 15) + 1; // От 1 до 16 монет
            const xpWin = Math.floor(Math.random() * 15) + 5;   // От 5 до 20 опыта

            currentUser.balance += coinWin;
            currentUser.last_chest_claim = now;
            if (typeof addPlayerXp === 'function') addPlayerXp(xpWin);

            localStorage.setItem('kristall_user', JSON.stringify(currentUser));
            showKristallToast(`Вы получили: +${coinWin} монет, +${xpWin} XP`, "📦");
            if (typeof buildProfilePage === 'function') buildProfilePage();
        });
    }

    // 6. Слушатель формы настроек профиля (Сохранение с украшением)
    const profileForm = document.getElementById('profile-edit-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const colorSelect = document.getElementById('edit-avatar-color');
            const chosenColor = colorSelect ? colorSelect.value : "#22d3ee";

            if (typeof saveProfileChanges === 'function') {
                saveProfileChanges(
                    document.getElementById('edit-username').value,
                    document.getElementById('edit-avatar').value,
                    document.getElementById('edit-password').value,
                    document.getElementById('edit-desc').value,
                    chosenColor
                );
            }
        });
    }

    // 7. Адаптивное бургер-меню для мобилок
    const burgerBtn = document.getElementById('burger-btn');
    const navMenu = document.getElementById('nav-menu');
    if (burgerBtn && navMenu) {
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            burgerBtn.classList.toggle('open');
            navMenu.classList.toggle('open');
        });
    }

    // 8. Открытие модалки авторизации при клике по аватаркам
    const pcProfile = document.querySelector('.pc-profile-block');
    const mobileProfile = document.querySelector('.mobile-profile-block');
    const authModal = document.getElementById('auth-modal');

    const handleProfileClick = () => {
        if (currentUser) { window.location.href = 'profile.html'; } 
        else { if (authModal) authModal.style.display = 'flex'; }
    };

    if (pcProfile) pcProfile.addEventListener('click', handleProfileClick);
    if (mobileProfile) mobileProfile.addEventListener('click', handleProfileClick);
    if (document.getElementById('close-auth-btn')) {
        document.getElementById('close-auth-btn').addEventListener('click', () => { authModal.style.display = 'none'; });
    }

    // 9. Формы авторизации (Вход и Регистрация)
    const logForm = document.getElementById('login-form');
    if (logForm) {
        logForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof localLogin === 'function') {
                localLogin(document.getElementById('login-email').value, document.getElementById('login-password').value);
            }
        });
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            if (typeof localRegister === 'function') {
                localRegister(
                    document.getElementById('register-username').value,
                    document.getElementById('register-email').value,
                    document.getElementById('register-password').value
                );
            }
        });
    }

    // 10. Переключение вкладок модалки Вход / Регистрация
    const tabLogin = document.getElementById('tab-login-btn');
    const tabRegister = document.getElementById('tab-register-btn');
    if (tabLogin && tabRegister) {
        tabRegister.addEventListener('click', () => {
            tabLogin.classList.remove('active'); tabRegister.classList.add('active');
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'flex';
        });
        tabLogin.addEventListener('click', () => {
            tabRegister.classList.remove('active'); tabLogin.classList.add('active');
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'flex';
        });
    }

    // 11. Кнопка Выхода из аккаунта
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('kristall_user');
            window.location.href = 'index.html';
        });
    }
}); // Конец DOMContentLoaded! Конвейер полностью сошёлся.
