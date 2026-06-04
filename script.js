// ==========================================
// 1. НАСТРОЙКИ И ЛОКАЛЬНЫЕ БАЗЫ ДАННЫХ
// ==========================================
const NEWS_URL = './databases/news.json';
const GAMES_URL = './databases/projects.json'; 
const USERS_URL = './databases/users.json'; 

let allGamesData = []; 
let currentTypeFilter = 'all';
let currentPlatFilter = 'all';

// Считываем пользователя из локальной памяти устройства
let currentUser = JSON.parse(localStorage.getItem('kristall_user')) || null;

// Функция расчета максимального опыта для уровня (Геймификация по экспоненте)
function getRequiredXp(level) {
    return level * 100; 
}

// ==========================================
// 2. АВТОНОМНАЯ СИСТЕМА АККАУНТОВ (LOCAL STORAGE)
// ==========================================
function localRegister(username, email, password) {
    const newUser = {
        username: username,
        email: email,
        password: password,
        role: "Пользователь",
        clearance_level: 1,
        level: 1,
        xp: 0,       
        balance: 0,  
        avatar_url: "", 
        description: "Новобранец KristallCommunity.",
        inventory: ["👾 Значок Новичка"] 
    };

    localStorage.setItem('kristall_user', JSON.stringify(newUser));
    currentUser = newUser;

    alert(`Успешно! Kristall ID для ${username} создан на вашем устройстве!`);
    updateHeaderProfile();
    buildProfilePage(); 
    document.getElementById('auth-modal').style.display = 'none';
}

async function localLogin(email, password) {
    try {
        const response = await fetch(USERS_URL);
        if (response.ok) {
            const usersArray = await response.json();
            const globalUser = usersArray.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            
            if (globalUser) {
                alert(`Авторизация Kristall ID успешна! Добро пожаловать, ${globalUser.username}.`);
                localStorage.setItem('kristall_user', JSON.stringify(globalUser));
                currentUser = globalUser;
                updateHeaderProfile();
                document.getElementById('auth-modal').style.display = 'none';
                window.location.reload(); 
                return;
            }
        }
    } catch (e) {
        console.warn("Глобальная база данных недоступна, проверяем локальную память...", e);
    }

    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase() && currentUser.password === password) {
        alert(`С возвращением, ${currentUser.username}! Авторизация выполнена.`);
        updateHeaderProfile();
        document.getElementById('auth-modal').style.display = 'none';
    } else {
        alert("Пользователь с такими данными не найден в базе Kristall ID или пароль неверен!");
    }
}

// ==========================================
// 3. ЗАГРУЗКА НОВОСТЕЙ И КАТАЛОГА С ФИЛЬТРАМИ
// ==========================================
async function loadNews() {
    const container = document.getElementById('news-container');
    if (!container) return;
    try {
        const response = await fetch(NEWS_URL);
        const newsData = await response.json();
        container.innerHTML = '';
        newsData.slice(0, 10).forEach(item => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.innerHTML = `<div class="news-date">${item.date}</div><div class="news-title">${item.title}</div><p class="news-text">${item.text}</p>`;
            container.appendChild(newsItem);
        });
    } catch (e) { 
        container.innerHTML = '<div class="news-item"><p class="news-text">Ошибка чтения новостей.</p></div>'; 
    }
}

async function loadProjectsPage() {
    const gridContainer = document.getElementById('projects-grid');
    if (!gridContainer) return; 
    try {
        if (allGamesData.length === 0) {
            const response = await fetch(GAMES_URL);
            allGamesData = await response.json();
        }
        const searchInput = document.getElementById('search-input');
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        gridContainer.innerHTML = ''; 

        const filteredGames = allGamesData.filter(game => {
            const matchesSearch = game.title.toLowerCase().includes(searchText);
            const matchesType = (currentTypeFilter === 'all' || game.type === currentTypeFilter);
            const matchesPlat = (currentPlatFilter === 'all' || game.platform.toLowerCase().includes(currentPlatFilter.toLowerCase()));
            return matchesSearch && matchesType && matchesPlat;
        });

        if (filteredGames.length === 0) {
            gridContainer.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1;">Ничего не найдено.</p>';
            return;
        }

        filteredGames.forEach(game => {
            const card = document.createElement('a');
            card.href = `project-template.html?game=${game.id}`;
            card.className = 'game-card';
            const badgeColor = game.type === 'pc' ? 'background-color: #3b82f6;' : 'background-color: #10b981;';
            card.innerHTML = `
                <div class="card-header">
                    <h3>${game.title}</h3>
                    <span class="badge" style="${badgeColor}">${game.platform}</span>
                </div>
                <p class="card-desc">${game.short_desc}</p>
                <div class="card-footer">Подробнее →</div>
            `;
            gridContainer.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

async function buildGameTemplatePage() {
    if (!document.getElementById('game-title')) return; 
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    if (!gameId) { window.location.href = 'projects.html'; return; }
    try {
        const response = await fetch(GAMES_URL);
        const games = await response.json();
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        document.title = `${game.title} - KristallCommunity`;
        document.getElementById('game-title').innerText = game.title;
        document.getElementById('game-short-desc').innerText = game.short_desc;
        document.getElementById('game-full-desc').innerText = game.full_desc;
        document.getElementById('game-platform').innerText = game.platform;
        document.getElementById('game-version').innerText = game.version;
        document.getElementById('game-developer').innerText = game.developer || "KristallCommunity";
        
        const downloadBtn = document.getElementById('game-download-btn');
        if (downloadBtn) {
            downloadBtn.href = game.download_path;
            const actionWord = game.type === 'pc' ? 'Скачать для ПК' : 'Скачать APK';
            downloadBtn.innerText = `${actionWord} (${game.price})`;
        }

        const featuresContainer = document.getElementById('game-features');
        if (featuresContainer && game.features) {
            featuresContainer.innerHTML = '';
            game.features.forEach(feat => {
                const li = document.createElement('li');
                li.innerHTML = `<span style="color: #10b981; font-weight: bold; margin-right: 5px;">✔</span> ${feat}`;
                featuresContainer.appendChild(li);
            });
        }

        const scrBlock = document.getElementById('screenshots-block');
        const scrContainer = document.getElementById('screenshots-container');
        if (game.screenshots && game.screenshots.length > 0 && scrBlock && scrContainer) {
            scrBlock.style.display = 'block';
            scrContainer.innerHTML = '';
            game.screenshots.forEach(src => {
                const img = document.createElement('img');
                img.src = src;
                img.style.width = "200px";
                img.style.height = "120px";
                img.style.borderRadius = "8px";
                img.style.objectFit = "cover";
                img.style.border = "1px solid #1f2937";
                img.style.cursor = "pointer";
                img.style.transition = "transform 0.2s, border-color 0.2s";
                img.addEventListener('mouseenter', () => { img.style.transform = "scale(1.05)"; img.style.borderColor = "#22d3ee"; });
                img.addEventListener('mouseleave', () => { img.style.transform = "scale(1)"; img.style.borderColor = "#1f2937"; });
                img.addEventListener('click', () => { window.open(src, '_blank'); });
                scrContainer.appendChild(img);
            });
        } else if (scrBlock) {
            scrBlock.style.display = 'none';
        }

        const instructionBlock = document.getElementById('instruction-block');
        const instructionList = document.getElementById('instruction-list');
        if (game.show_instruction && instructionBlock && instructionList) {
            instructionBlock.style.display = 'block'; 
            instructionList.innerHTML = ''; 
            if (game.instruction_type === 'android') {
                instructionList.innerHTML = `
                    <li>Нажмите зеленую кнопку выше для скачивания файла.</li>
                    <li>Разрешите сохранение файла в системе, если браузер выдаст предупреждение.</li>
                    <li>Откройте скачанный APK на телефоне и в настройках безопасности разрешите <em>"Установку из неизвестных источников"</em>.</li>
                    <li>Завершите процесс установки и запустите приложение/игру!</li>
                `;
            } else if (game.instruction_type === 'pc') {
                instructionList.innerHTML = `
                    <li>Скачайте архив с игрой по кнопке выше.</li>
                    <li>Распакуйте скачанный ZIP/RAR архив в любую удобную папку на жестком диске.</li>
                    <li>Найдите файл запуска игры с расширением <strong>.exe</strong> и дважды нажмите по нему.</li>
                    <li>Пользуйтесь! Рекомендуется создать ярлык на рабочем столе.</li>
                `;
            }
        } else if (instructionBlock) {
            instructionBlock.style.display = 'none'; 
        }
    } catch (e) { console.error("Ошибка сборки страницы шаблона:", e); }
}

function initFiltersAndSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    searchInput.addEventListener('input', loadProjectsPage);
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const clickedBtn = e.target;
            if (clickedBtn.hasAttribute('data-filter-type')) {
                document.querySelectorAll('[data-filter-type]').forEach(b => b.classList.remove('active'));
                currentTypeFilter = clickedBtn.getAttribute('data-filter-type');
            }
            if (clickedBtn.hasAttribute('data-filter-plat')) {
                document.querySelectorAll('[data-filter-plat]').forEach(b => b.classList.remove('active'));
                currentPlatFilter = clickedBtn.getAttribute('data-filter-plat');
            }
            clickedBtn.classList.add('active');
            loadProjectsPage();
        });
    });
}

// ==========================================
// 3.Б. ЗАГРУЗКА МАРКЕТПЛЕЙСА И КАТЕГОРИЙ
// ==========================================
const MARKET_URL = './databases/market.json';
let allMarketData = [];
let currentMarketFilter = 'all';

async function loadMarketplacePage() {
    const gridContainer = document.getElementById('marketplace-grid');
    const marketBalNum = document.getElementById('market-balance-num');
    if (!gridContainer) return;

    if (marketBalNum) {
        marketBalNum.innerText = currentUser ? currentUser.balance : 0;
    }

    try {
        if (allMarketData.length === 0) {
            const response = await fetch(MARKET_URL);
            allMarketData = await response.json();
        }
        const searchInput = document.getElementById('market-search-input');
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';
        gridContainer.innerHTML = '';

        const filteredProducts = allMarketData.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchText) || item.desc.toLowerCase().includes(searchText);
            const matchesCategory = (currentMarketFilter === 'all' || item.category === currentMarketFilter);
            return matchesSearch && matchesCategory;
        });

        if (filteredProducts.length === 0) {
            gridContainer.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1; text-align:center;">Товары в данной категории не найдены.</p>';
            return;
        }

        filteredProducts.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const icon = item.category === 'role' ? '👑' : '📦';
            const isOwned = currentUser && currentUser.inventory.includes(item.title);
            const btnText = isOwned ? "Куплено" : `${item.price} 🪙`;
            const btnStyle = isOwned ? "background-color: #27272a; color: #71717a; cursor: not-allowed;" : "";

            card.innerHTML = `
                <div>
                    <span class="product-icon">${icon}</span>
                    <div class="product-title">${item.title}</div>
                    <p class="product-desc">${item.desc}</p>
                </div>
                <div class="product-footer">
                    <div class="product-price">${item.price} <span class="coin-icon"></span></div>
                    <button class="auth-submit-btn" style="padding: 8px 16px; font-size: 13px; ${btnStyle}" ${isOwned ? 'disabled' : ''} onclick="buyMarketItem('${item.title}', ${item.price}, '${item.category}')">${btnText}</button>
                </div>
            `;
            gridContainer.appendChild(card);
        });
    } catch (e) {
        console.error("Ошибка маркетплейса:", e);
        gridContainer.innerHTML = '<p style="color: #ef4444;">Не удалось загрузить товары магазина.</p>';
    }
}

function initMarketplaceFilters() {
    const searchInput = document.getElementById('market-search-input');
    if (!searchInput) return;
    searchInput.addEventListener('input', loadMarketplacePage);
    document.querySelectorAll('[data-market-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-market-filter]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMarketFilter = e.target.getAttribute('data-market-filter');
            loadMarketplacePage();
        });
    });
}

window.buyMarketItem = function(itemName, price, category) {
    if (!currentUser) { alert("Войдите в Kristall ID, чтобы совершать покупки!"); return; }
    if (currentUser.balance < price) { alert("Недостаточно монет на балансе Kristall ID!"); return; }
    if (currentUser.inventory.includes(itemName)) { alert("Этот предмет уже куплен!"); return; }

    currentUser.balance -= price;
    currentUser.inventory.push(itemName);

    if (category === 'role') {
        if (itemName.includes("Элита") && currentUser.clearance_level < 2) {
            currentUser.clearance_level = 2;
            alert("Поздравляем! Ваш уровень допуска повышен до Уровня 2 [Элита]!");
        } else if (itemName.includes("Создатель") && currentUser.clearance_level < 3) {
            currentUser.clearance_level = 3;
            alert("Поздравляем! Ваш уровень допуска повышен до Уровня 3 [Создатель]!");
        }
    }

    localStorage.setItem('kristall_user', JSON.stringify(currentUser));
    alert(`Успешная покупка: ${itemName}! Предмет добавлен в ваш инвентарь.`);
    loadMarketplacePage();
    updateHeaderProfile();
};

// ==========================================
// 4. ИНТЕРФЕЙС, АВАТАРКИ И ЦВЕТА РОЛЕЙ
// ==========================================
const DEFAULT_SVG_AVATAR = `<svg viewBox="0 0 24 24" style="width:32px; height:32px; border-radius:50%; border:2px solid #22d3ee; padding:5px; background:#1f2937; fill:#22d3ee; box-sizing:border-box;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;
const DEFAULT_SVG_LARGE = `<svg viewBox="0 0 24 24" style="width:80px; height:80px; border-radius:50%; border:3px solid #22d3ee; padding:12px; background:#1f2937; fill:#22d3ee; box-sizing:border-box;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;

function updateHeaderProfile() {
    const headerUsername = document.getElementById('header-username');
    const headerUsernameMobile = document.getElementById('header-username-mobile');
    const avatarPc = document.getElementById('header-avatar-img-pc');
    const avatarMobile = document.getElementById('header-avatar-img-mobile');
    
    if (!headerUsername) return;

    if (currentUser) {
        let nameColor = "white"; 

        if (currentUser.clearance_level === 2) { nameColor = "#f97316"; } 
        else if (currentUser.clearance_level === 3) { nameColor = "#10b981"; } 
        else if (currentUser.clearance_level === 4) { nameColor = "#a855f7"; } 
        else if (currentUser.clearance_level === 5) { nameColor = "#ef4444"; } 
        else if (currentUser.clearance_level === 6) { nameColor = "#22d3ee"; } 

        headerUsername.innerText = currentUser.username;
        headerUsername.style.color = nameColor; 

        if (headerUsernameMobile) {
            headerUsernameMobile.innerText = currentUser.username;
            headerUsernameMobile.style.color = nameColor;
        }

        const avatarHTML = (currentUser.avatar_url && currentUser.avatar_url.startsWith('http')) 
            ? `<img src="${currentUser.avatar_url}" style="width:32px; height:32px; border-radius:50%; border:2px solid #22d3ee; object-fit:cover;">`
            : DEFAULT_SVG_AVATAR;

        if (avatarPc) avatarPc.innerHTML = avatarHTML;
        if (avatarMobile) avatarMobile.innerHTML = avatarHTML;
    } else {
        headerUsername.innerText = 'Гость';
        headerUsername.style.color = 'white';
        if (headerUsernameMobile) {
            headerUsernameMobile.innerText = 'Гость';
            headerUsernameMobile.style.color = 'white';
        }
        if (avatarPc) avatarPc.innerHTML = DEFAULT_SVG_AVATAR;
        if (avatarMobile) avatarMobile.innerHTML = DEFAULT_SVG_AVATAR;
    }
}

function buildProfilePage() {
    const profName = document.getElementById('prof-username');
    if (!profName) return; 

    if (!currentUser) { window.location.href = 'index.html'; return; }

    let roleName = "Пользователь";
    let nameColor = "white";
    if (currentUser.clearance_level === 2) { roleName = "Элита"; nameColor = "#f97316"; }
    else if (currentUser.clearance_level === 3) { roleName = "Создатель"; nameColor = "#10b981"; }
    else if (currentUser.clearance_level === 4) { roleName = "Модератор"; nameColor = "#a855f7"; }
    else if (currentUser.clearance_level === 5) { roleName = "Администратор"; nameColor = "#ef4444"; }
    else if (currentUser.clearance_level === 6) { roleName = "Владелец"; nameColor = "#22d3ee"; }

    profName.innerText = currentUser.username;
    profName.style.color = nameColor;
    
    const profRoleField = document.getElementById('prof-role');
    if (profRoleField) {
        profRoleField.innerText = roleName;
        profRoleField.style.color = nameColor;
    }
    
    const avatarBox = document.getElementById('prof-avatar-box');
    if (avatarBox) {
        avatarBox.innerHTML = (currentUser.avatar_url && currentUser.avatar_url.startsWith('http')) 
            ? `<img src="${currentUser.avatar_url}" style="width:80px; height:80px; border-radius:50%; object-fit:cover;">`
            : DEFAULT_SVG_LARGE;
    }

    document.getElementById('prof-level').innerText = currentUser.level;
    document.getElementById('balance-num').innerText = currentUser.balance;
    document.getElementById('prof-desc-text').innerText = currentUser.description || "Новобранец KristallCommunity.";

    document.getElementById('edit-username').value = currentUser.username;
    document.getElementById('edit-avatar').value = currentUser.avatar_url || "";
    document.getElementById('edit-password').value = currentUser.password || "";
    document.getElementById('edit-desc').value = currentUser.description || "";

    const colorSelect = document.getElementById('edit-avatar-color');
    if (colorSelect) {
        colorSelect.innerHTML = `
            <option value="#22d3ee">Циановый неон (Бесплатно)</option>
            <option value="#f97316">Огненный оранжевый (Бесплатно)</option>
            <option value="#10b981">Изумрудный зелёный (Бесплатно)</option>
            <option value="#a855f7">Магический пурпурный (Бесплатно)</option>
            <option value="#ef4444">Критический красный (Бесплатно)</option>
        `;

        if (currentUser.inventory.includes("🔥 Украшение: Адское Пламя")) {
            colorSelect.innerHTML += `<option value="decor-fire">🔥 Анимация: Адское Пламя</option>`;
        }
        if (currentUser.inventory.includes("⚡ Украшение: Кибер-Импульс")) {
            colorSelect.innerHTML += `<option value="decor-cyber">⚡ Анимация: Кибер-Импульс</option>`;
        }

        colorSelect.value = currentUser.avatar_color || "#22d3ee";
    }

    const reqXp = getRequiredXp(currentUser.level);
    document.getElementById('prof-xp-text').innerText = `${currentUser.xp} / ${reqXp} XP`;
    const percent = Math.min((currentUser.xp / reqXp) * 100, 100);
    document.getElementById('prof-xp-fill').style.width = `${percent}%`;

    const invContainer = document.getElementById('prof-inventory');
    if (invContainer) {
        if (currentUser.inventory && currentUser.inventory.length > 0) {
            invContainer.innerHTML = '';
            currentUser.inventory.forEach(item => {
                const span = document.createElement('span');
                span.className = 'inv-item';
                span.innerText = item;
                invContainer.appendChild(span);
            });
        } else { invContainer.innerHTML = '<span style="color: #4b5563;">В инвентаре пока пусто.</span>'; }
    }
    
    applyAvatarBorderColor();
}

function saveProfileChanges(newName, newAv, newPass, newDesc, newColor) {
    if (!currentUser) return;
    currentUser.username = newName;
    currentUser.avatar_url = newAv;
    currentUser.password = newPass;
    currentUser.description = newDesc;
    currentUser.avatar_color = newColor; // Намертво записываем украшение в память устройства!

    localStorage.setItem('kristall_user', JSON.stringify(currentUser));
    alert("Данные профиля Kristall ID успешно изменены!");
    buildProfilePage();
    updateHeaderProfile();
}

// ==========================================
// 5. ЕДИНЫЙ ГЛАВНЫЙ СЛУШАТЕЛЬ СОБЫТИЙ И КЛИКОВ (DOM)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Конвейер параллельной загрузки новостей и проектов
    Promise.all([loadNews(), loadProjectsPage(), buildGameTemplatePage(), loadMarketplacePage()])
        .then(() => { 
            if (typeof initFiltersAndSearch === 'function') initFiltersAndSearch(); 
            if (typeof initMarketplaceFilters === 'function') initMarketplaceFilters();
        })
        .catch(err => console.error("Ошибка загрузки модулей сайта:", err));

    // 2. Отрисовка всех шапок и элементов профиля при заходе
    updateHeaderProfile();
    buildProfilePage();
    if (typeof buildMainSideProfile === 'function') buildMainSideProfile();
    
    // Автоматически красим и анимируем рамки в шапке при загрузке любой страницы!
    applyAvatarBorderColor();

    // 3. Логика нативной рекламы Kristall Partners (Рекламная система сообщества)
    const btnPromo = document.getElementById('btn-promo-ad');
    if (btnPromo) {
        btnPromo.addEventListener('click', () => {
            if (!currentUser) {
                alert("🔒 Функция доступна только для авторизованных пользователей Kristall ID!");
                return;
            }
            const now = Date.now();
            const lastAdClaim = currentUser.last_ad_claim || 0;

            if (now - lastAdClaim < 86400000) {
                const hoursLeft = Math.ceil((86400000 - (now - lastAdClaim)) / 3600000);
                alert(`⏳ Награда за поддержку партнёров уже получена! Следующая награда будет доступна через ${hoursLeft} ч.`);
                return;
            }

            currentUser.balance += 8; // +8 монет
            currentUser.last_ad_claim = now;
            localStorage.setItem('kristall_user', JSON.stringify(currentUser));
            
            alert("📺 Спасибо за поддержку Kristall Partners! +8 монет зачислено на ваш баланс.");
            if (typeof buildMainSideProfile === 'function') buildMainSideProfile(); 
            updateHeaderProfile();
            
            // Открываем RuTube-канал твоего друга
            window.open("https://rutube.ru", "_blank"); 
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
                alert(`⏳ Бонус еще не перезарядился! Вернитесь через ${hoursLeft} ч.`);
                return;
            }

            currentUser.balance += 5; // +5 честных монет
            currentUser.last_daily_claim = now;
            addPlayerXp(5); // +5 опыта
            
            localStorage.setItem('kristall_user', JSON.stringify(currentUser));
            alert("📆 Ежедневный бонус получен! +5 монет, +5 XP.");
            buildProfilePage();
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
                alert(`⏳ Сундук пуст! До следующего открытия осталось ${minsLeft} мин.`);
                return;
            }

            const coinWin = Math.floor(Math.random() * 15) + 1; // От 1 до 16 монет
            const xpWin = Math.floor(Math.random() * 15) + 5;   // От 5 до 20 опыта

            currentUser.balance += coinWin;
            currentUser.last_chest_claim = now;
            addPlayerXp(xpWin);

            localStorage.setItem('kristall_user', JSON.stringify(currentUser));
            alert(`📦 Вы открыли Сундук Удачи и получили:\n🪙 +${coinWin} монет\n✨ +${xpWin} XP`);
            buildProfilePage();
        });
    }

    // 6. Слушатель формы настроек профиля (Сохранение с цветом/анимацией)
    const profileForm = document.getElementById('profile-edit-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const colorSelect = document.getElementById('edit-avatar-color');
            const chosenColor = colorSelect ? colorSelect.value : "#22d3ee";

            saveProfileChanges(
                document.getElementById('edit-username').value,
                document.getElementById('edit-avatar').value,
                document.getElementById('edit-password').value,
                document.getElementById('edit-desc').value,
                chosenColor // Передаем украшение пятым параметром!
            );
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
            localLogin(document.getElementById('login-email').value, document.getElementById('login-password').value);
        });
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            localRegister(
                document.getElementById('register-username').value,
                document.getElementById('register-email').value,
                document.getElementById('register-password').value
            );
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
}); // Здесь идеально закрывается DOMContentLoaded из Части А!

// ==========================================================================
// 6. СИСТЕМА НАГРАД И КАСТОМИЗАЦИЯ ОБВОДКИ (АВТОНОМНЫЕ ФУНКЦИИ)
// ==========================================================================

function applyAvatarBorderColor() {
    if (!currentUser) return;
    const selection = currentUser.avatar_color || "#22d3ee";
    
    const targets = document.querySelectorAll('#prof-avatar-box img, #prof-avatar-box svg, #header-avatar-img-pc img, #header-avatar-img-pc svg, #header-avatar-img-mobile img, #header-avatar-img-mobile svg');

    targets.forEach(el => {
        if (!el) return;
        el.className = ''; 
        el.style.boxShadow = 'none';
        el.style.animation = 'none';

        if (selection === 'decor-fire') {
            el.classList.add('decor-fire-animation');
        } else if (selection === 'decor-cyber') {
            el.classList.add('decor-cyber-animation');
        } else {
            el.style.borderColor = selection;
            if (currentUser.inventory.includes("💥 Неоновая Аура")) {
                el.style.boxShadow = `0 0 15px ${selection}, inset 0 0 10px ${selection}`;
            }
        }
    });

    const sideAvatarContainer = document.querySelector('#main-side-profile div');
    if (sideAvatarContainer) {
        sideAvatarContainer.className = '';
        sideAvatarContainer.style.boxShadow = 'none';
        sideAvatarContainer.style.animation = 'none';
        sideAvatarContainer.style.borderColor = 'transparent'; // Сбрасываем дефолт
        
        if (selection === 'decor-fire') {
            sideAvatarContainer.classList.add('decor-fire-animation');
        } else if (selection === 'decor-cyber') {
            sideAvatarContainer.classList.add('decor-cyber-animation');
        } else {
            // Если выбрана обычная бесплатная обводка
            sideAvatarContainer.style.borderColor = selection;
            if (currentUser.inventory.includes("💥 Неоновая Аура")) {
                sideAvatarContainer.style.boxShadow = `0 0 15px ${selection}`;
            }
        }
    }
}

function addPlayerXp(amount) {
    if (!currentUser) return;
    currentUser.xp += amount;
    let reqXp = currentUser.level * 100;

    while (currentUser.xp >= reqXp) {
        currentUser.xp -= reqXp;
        currentUser.level += 1;
        reqXp = currentUser.level * 100;
        alert(`🎉 КРИСТАЛЛЬНЫЙ АП! Вы достигли ${currentUser.level} уровня аккаунта!`);
    }
    localStorage.setItem('kristall_user', JSON.stringify(currentUser));
}

// ==========================================================================
// ИСПРАВЛЕНО: ВОЗВРАЩАЕМ УТЕРЯННУЮ ФУНКЦИЮ ВИДЖЕТА НА ГЛАВНОЙ СТРАНИЦЕ
// ==========================================================================
function buildMainSideProfile() {
    const sideBox = document.getElementById('main-side-profile');
    if (!sideBox) return; 

    if (currentUser) {
        let roleName = "Пользователь";
        let nameColor = "white";
        if (currentUser.clearance_level === 2) { roleName = "Элита"; nameColor = "#f97316"; }
        else if (currentUser.clearance_level === 3) { roleName = "Создатель"; nameColor = "#10b981"; }
        else if (currentUser.clearance_level === 4) { roleName = "Модератор"; nameColor = "#a855f7"; }
        else if (currentUser.clearance_level === 5) { roleName = "Администратор"; nameColor = "#ef4444"; }
        else if (currentUser.clearance_level === 6) { roleName = "Владелец"; nameColor = "#22d3ee"; }

        const currentBorderColor = currentUser.avatar_color || "#22d3ee"; 
        
        const hasAuraShadow = currentUser.inventory.includes("💥 Неоновая Аура") 
            ? `box-shadow: 0 0 15px ${currentBorderColor}; border: 2px solid ${currentBorderColor};` 
            : `border: 2px solid ${currentBorderColor};`; 

        const sideAvatarHTML = (currentUser.avatar_url && currentUser.avatar_url.startsWith('http'))
            ? `<img src="${currentUser.avatar_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`
            : `<svg viewBox="0 0 24 24" style="width:60%; height:60%; fill:${currentBorderColor};"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;

        sideBox.innerHTML = `
            <div style="width: 55px; height: 55px; border-radius: 50%; ${hasAuraShadow} display: flex; align-items: center; justify-content: center; background: #1f2937; margin-bottom: 5px; overflow:hidden;">
                ${sideAvatarHTML}
            </div>
            <div style="color: ${nameColor}; font-weight: bold; font-size: 16px;">${currentUser.username}</div>
            <div style="color: ${nameColor}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">${roleName}</div>
            
            <div style="width: 100%; margin-top: 10px; border-top: 1px solid #1f2937; padding-top: 10px; display: flex; justify-content: space-around; font-size: 13px;">
                <div style="color: #9ca3af;">Уровень: <strong style="color: #22d3ee;">${currentUser.level}</strong></div>
                <div style="color: #9ca3af;">Баланс: <strong style="color: #10b981;">${currentUser.balance} 🪙</strong></div>
            </div>
            <a href="profile.html" style="width: 100%; margin-top: 12px; background: #1f2937; color: white; border: 1px solid #374151; padding: 8px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold; transition: 0.2s; text-align:center;" onmouseenter="this.style.borderColor='#22d3ee'" onmouseleave="this.style.borderColor='#374151'">Открыть личный кабинет</a>
        `;
    } else {
        sideBox.innerHTML = `
            <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px dashed #374151; display: flex; align-items: center; justify-content: center; background: #111827; margin-bottom: 5px;">
                <svg viewBox="0 0 24 24" style="width:50%; height:50%; fill:#4b5563;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            </div>
            <div style="color: white; font-weight: bold; font-size: 15px;">Kristall ID не найден</div>
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">Войдите, чтобы копить монеты и открывать сундуки!</div>
            <button class="auth-submit-btn" style="width: 100%; padding: 8px; font-size: 12px;" onclick="document.querySelector('.pc-profile-block').click()">Войти в аккаунт</button>
        `;
    }
    applyAvatarBorderColor();
}
