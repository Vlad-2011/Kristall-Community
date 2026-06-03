// ==========================================
// 1. НАСТРОЙКИ И ЛОКАЛЬНЫЕ БАЗЫ ДАННЫХ
// ==========================================
const NEWS_URL = './databases/news.json';
const GAMES_URL = './databases/projects.json'; 
const USERS_URL = './databases/users.json'; // Путь к твоей глобальной базе друзей

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
// 2. ГИБРИДНАЯ СИСТЕМА АККАУНТОВ (ВХОД ПО JSON)
// ==========================================

// Локальная регистрация на устройстве
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

// УМНЫЙ ВХОД: Сначала ищет в глобальном users.json, если не нашел — проверяет локально
async function localLogin(email, password) {
    try {
        // 1. Пытаемся скачать файл пользователей с твоего GitHub (без токенов и CORS!)
        const response = await fetch(USERS_URL);
        if (response.ok) {
            const usersArray = await response.json();
            
            // Ищем друга по почте и паролю в твоем файле
            const globalUser = usersArray.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            
            if (globalUser) {
                alert(`Авторизация Kristall ID успешна! Добро пожаловать, ${globalUser.username}.`);
                localStorage.setItem('kristall_user', JSON.stringify(globalUser));
                currentUser = globalUser;
                updateHeaderProfile();
                document.getElementById('auth-modal').style.display = 'none';
                window.location.reload(); // Перезагружаем страницу чтобы применить права
                return;
            }
        }
    } catch (e) {
        console.warn("Глобальная база данных недоступна, проверяем локальную память...", e);
    }

    // 2. Если в users.json такого человека нет, проверяем локальный аккаунт этого устройства
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
        
        // Очищаем каталог перед выводом отфильтрованных карточек
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
    if (!gameId) return;
    try {
        const response = await fetch(GAMES_URL);
        const games = await response.json();
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        document.getElementById('game-title').innerText = game.title;
        document.getElementById('game-short-desc').innerText = game.short_desc;
        document.getElementById('game-full-desc').innerText = game.full_desc;
        document.getElementById('game-platform').innerText = game.platform;
        document.getElementById('game-version').innerText = game.version;
        document.getElementById('game-developer').innerText = game.developer || "KristallCommunity";
        const downloadBtn = document.getElementById('game-download-btn');
        downloadBtn.href = game.download_path;
        downloadBtn.innerText = `Скачать (${game.price})`;
        
        // РЕНДЕРИНГ ГАЛЕРЕИ СКРИНШОТОВ
        const scrBlock = document.getElementById('screenshots-block');
        const scrContainer = document.getElementById('screenshots-container');
        
        if (game.screenshots && game.screenshots.length > 0 && scrBlock && scrContainer) {
            scrBlock.style.display = 'block';
            scrContainer.innerHTML = ''; // Очищаем контейнер

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

                // Эффект увеличения при наведении в геймерском стиле
                img.addEventListener('mouseenter', () => { img.style.transform = "scale(1.05)"; img.style.borderColor = "#22d3ee"; });
                img.addEventListener('mouseleave', () => { img.style.transform = "scale(1)"; img.style.borderColor = "#1f2937"; });
                
                // Клик по скриншоту откроет его в новой вкладке во весь экран!
                img.addEventListener('click', () => { window.open(src, '_blank'); });

                scrContainer.appendChild(img);
            });
        } else if (scrBlock) {
            scrBlock.style.display = 'none';
        }

    } catch (e) { console.error(e); }
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
    if (!gridContainer) return; // Запускаем только на странице marketplace.html

    // Синхронизируем баланс пользователя с шапкой магазина
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

        gridContainer.innerHTML = ''; // Очищаем витрину магазина

        // Умная фильтрация по поиску и категориям (Предметы / Роли)
        const filteredProducts = allMarketData.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchText) || item.desc.toLowerCase().includes(searchText);
            const matchesCategory = (currentMarketFilter === 'all' || item.category === currentMarketFilter);
            return matchesSearch && matchesCategory;
        });

        if (filteredProducts.length === 0) {
            gridContainer.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1; text-align:center;">Товары в данной категории не найдены.</p>';
            return;
        }

        // Строим красивые профессиональные карточки товаров
        filteredProducts.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Выбираем значок в зависимости от категории
            const icon = item.category === 'role' ? '👑' : '📦';
            
            // Проверяем, куплен ли уже предмет
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

// Слушатели кнопок-категорий и поиска в магазине
function initMarketplaceFilters() {
    const searchInput = document.getElementById('market-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', loadMarketplacePage);

    document.querySelectorAll('[data-market-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-market-filter]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMarketFilter = e.target.getAttribute('data-market-filter');
            loadMarketplacePage(); // Перерисовываем витрину магазина
        });
    });
}

// Функция глобальной покупки в маркетплейсе с авто-прокачкой ролей!
window.buyMarketItem = function(itemName, price, category) {
    if (!currentUser) { alert("Войдите в Kristall ID, чтобы совершать покупки!"); return; }
    if (currentUser.balance < price) { alert("Недостаточно коинов на балансе Kristall ID!"); return; }
    if (currentUser.inventory.includes(itemName)) { alert("Этот предмет уже куплен!"); return; }

    // Списываем средства
    currentUser.balance -= price;
    currentUser.inventory.push(itemName);

    // 🔥 ИГРОВАЯ МЕХАНИКА: Если куплена роль — автоматически повышаем clearance_level!
    if (category === 'role') {
        if (itemName.includes("Элита") && currentUser.clearance_level < 2) {
            currentUser.clearance_level = 2;
            alert("Поздравляем! Ваш уровень допуска повышен до Уровня 2 [Элита]!");
        } else if (itemName.includes("Создатель") && currentUser.clearance_level < 3) {
            currentUser.clearance_level = 3;
            alert("Поздравляем! Ваш уровень допуска повышен до Уровня 3 [Создатель]!");
        }
    }

    // Сохраняем новые данные в память устройства
    localStorage.setItem('kristall_user', JSON.stringify(currentUser));
    alert(`Успешная покупка: ${itemName}! Предмет добавлен в ваш инвентарь.`);
    
    // Мгновенно обновляем магазин и шапку сайта
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

        if (currentUser.clearance_level === 2) { nameColor = "#f97316"; } // Оранжевый для Элиты
        else if (currentUser.clearance_level === 3) { nameColor = "#10b981"; } // Изумрудный для Создателей
        else if (currentUser.clearance_level === 4) { nameColor = "#a855f7"; } // Фиолетовый для Модераторов
        else if (currentUser.clearance_level === 5) { nameColor = "#ef4444"; } // Красный для Администраторов
        else if (currentUser.clearance_level === 6) { nameColor = "#22d3ee"; } // Голубой для Владельца

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
            ? `<img src="${currentUser.avatar_url}" style="width:80px; height:80px; border-radius:50%; border:3px solid #22d3ee; object-fit:cover;">`
            : DEFAULT_SVG_LARGE;
    }

    document.getElementById('prof-level').innerText = currentUser.level;
    document.getElementById('balance-num').innerText = currentUser.balance;
    document.getElementById('prof-desc-text').innerText = currentUser.description || "Новобранец KristallCommunity.";

    // const workshopBtn = document.getElementById('btn-open-workshop');
    // if (workshopBtn) {
    //     if (currentUser.clearance_level >= 3) { workshopBtn.style.display = 'flex'; } 
    //     else { workshopBtn.style.display = 'none'; }
    // }

    const workshopBtn = document.getElementById('btn-open-workshop');
    if (workshopBtn) {
        if (currentUser.clearance_level >= 3) { workshopBtn.style.display = 'flex'; } 
        else { workshopBtn.style.display = 'none'; }
    }

    document.getElementById('edit-username').value = currentUser.username;
    document.getElementById('edit-avatar').value = currentUser.avatar_url || "";
    document.getElementById('edit-password').value = currentUser.password || "";
    document.getElementById('edit-desc').value = currentUser.description || "";

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
    
    // ЭФФЕКТ ПРЕДМЕТА: Включаем неоновую ауру, если она есть в инвентаре
    const avatarImgElement = document.querySelector('#prof-avatar-box img');
    const avatarSvgElement = document.querySelector('#prof-avatar-box svg');
    
    if (currentUser.inventory.includes("💥 Неоновая Аура")) {
        // Если Аура куплена — заставляем аватарку сочно гореть ционовым неоном!
        if (avatarImgElement) avatarImgElement.style.boxShadow = "0 0 20px #22d3ee, inset 0 0 20px #22d3ee";
        if (avatarSvgElement) avatarSvgElement.style.boxShadow = "0 0 20px #22d3ee, inset 0 0 20px #22d3ee";
    } else {
        // Если ауры нет — сбрасываем свечение на стандартное
        if (avatarImgElement) avatarImgElement.style.boxShadow = "none";
        if (avatarSvgElement) avatarSvgElement.style.boxShadow = "none";
    }
}

function saveProfileChanges(newName, newAv, newPass, newDesc) {
    if (!currentUser) return;
    currentUser.username = newName;
    currentUser.avatar_url = newAv;
    currentUser.password = newPass;
    currentUser.description = newDesc;

    localStorage.setItem('kristall_user', JSON.stringify(currentUser));
    alert("Данные профиля Kristall ID успешно изменены!");
    buildProfilePage();
    updateHeaderProfile();
}

// ==========================================
// 5. ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ КЛИКОВ (DOM)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([loadNews(), loadProjectsPage(), buildGameTemplatePage(), loadMarketplacePage()])
        .then(() => { 
            initFiltersAndSearch(); 
            initMarketplaceFilters();
        })
        .catch(err => console.error("Ошибка загрузки модулей сайта:", err));

    updateHeaderProfile();
    buildProfilePage();

    const btnWork = document.getElementById('btn-open-workshop');
    const panelWork = document.getElementById('panel-workshop');
    if (btnWork && panelWork) {
        btnWork.addEventListener('click', () => {
            panelWork.style.display = panelWork.style.display === 'block' ? 'none' : 'block';
        });
    }

    const workshopForm = document.getElementById('workshop-game-form');
    if (workshopForm) {
        workshopForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const gTitle = document.getElementById('work-title').value;
            const gPlat = document.getElementById('work-platform').value;
            const gShort = document.getElementById('work-short').value;
            const gFull = document.getElementById('work-full').value;

            const jsonOutput = {
                id: gTitle.toLowerCase().replace(/\s+/g, '-'),
                title: gTitle,
                platform: gPlat,
                type: gPlat.toLowerCase().includes('win') ? 'pc' : 'mobile',
                developer: currentUser ? currentUser.username : "Создатель",
                version: "v1.0.0",
                price: "FREE",
                download_path: "ССЫЛКУ_УКАЖЕТ_ВЛАДЕЛЕЦ",
                short_desc: gShort,
                full_desc: gFull,
                features: ["Увлекательный геймплей", "Чистая оптимизация"],
                requirements: "Уточняются",
                show_instruction: true,
                instruction_type: gPlat.toLowerCase().includes('win') ? 'pc' : 'android'
            };

            document.getElementById('code-output-text').value = JSON.stringify(jsonOutput, null, 2);
            document.getElementById('code-output-block').style.display = 'block';
        });
    }

    const burgerBtn = document.getElementById('burger-btn');
    const navMenu = document.getElementById('nav-menu');
    if (burgerBtn && navMenu) {
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            burgerBtn.classList.toggle('open');
            navMenu.classList.toggle('open');
        });
    }

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

    const profileForm = document.getElementById('profile-edit-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfileChanges(
                document.getElementById('edit-username').value,
                document.getElementById('edit-avatar').value,
                document.getElementById('edit-password').value,
                document.getElementById('edit-desc').value
            );
        });
    }

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

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('kristall_user');
            window.location.href = 'index.html';
        });
    }
});
