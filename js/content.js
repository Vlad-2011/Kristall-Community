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

        // Наполняем основные тексты (ОПИСАНИЕ СЕЙЧАС НЕ СКРЫВАЕТСЯ!)
        document.title = `${game.title} - KristallCommunity`;
        document.getElementById('game-title').innerText = game.title;
        document.getElementById('game-short-desc').innerText = game.short_desc;
        document.getElementById('game-full-desc').innerText = game.full_desc || "Описание проекта готовится к публикации.";
        document.getElementById('game-platform').innerText = game.platform;
        document.getElementById('game-version').innerText = game.version;
        document.getElementById('game-developer').innerText = game.developer || "KristallCommunity";
        
        const downloadBtn = document.getElementById('game-download-btn');
        if (downloadBtn) {
            downloadBtn.href = game.download_path;
            const actionWord = game.type === 'pc' ? 'Скачать для ПК' : 'Скачать APK';
            downloadBtn.innerText = `${actionWord} (${game.price})`;
        }

        // УМНОЕ СКРЫТИЕ КЛЮЧЕВЫХ ОСОБЕННОСТЕЙ
        const featuresBlock = document.getElementById('features-block');
        const featuresContainer = document.getElementById('game-features');
        if (featuresContainer && game.features && game.features.length > 0) {
            if (featuresBlock) featuresBlock.style.display = 'block';
            featuresContainer.innerHTML = '';
            game.features.forEach(feat => {
                const li = document.createElement('li');
                li.innerHTML = `<span style="color: #10b981; font-weight: bold; margin-right: 5px;">✔</span> ${feat}`;
                featuresContainer.appendChild(li);
            });
        } else if (featuresBlock) {
            featuresBlock.style.display = 'none'; 
        }

        // УМНОЕ СКРЫТИЕ И РЕНДЕРИНГ СКРИНШОТОВ (ТЕПЕРЬ ПОД ТРЕЙЛЕРОМ НАВЕРХУ!)
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

        // УМНОЕ СКРЫТИЕ И ВЫВОД ВИДЕО-ТРЕЙЛЕРА STEAM-STYLE
        const trailerBlock = document.getElementById('trailer-block');
        const trailerContainer = document.getElementById('trailer-container');
        if (game.trailer_url && trailerBlock && trailerContainer) {
            trailerBlock.style.display = 'block';
            trailerContainer.innerHTML = `
                <div style="position: relative; width: 100%; padding-top: 56.25%; background: #000; border-radius: 8px; overflow: hidden; border: 1px solid #1f2937;">
                    <iframe src="${game.trailer_url}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                </div>
            `;
        } else if (trailerBlock) {
            trailerBlock.style.display = 'none'; 
        }

        // ВЫВОД ИНСТРУКЦИИ ПО УСТАНОВКЕ
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
            
            let previewClass = "";
            let previewStyle = "border: 2px solid #374151;"; 
            
            if (item.id === 'decor-fire') previewClass = "decor-fire-animation";
            else if (item.id === 'decor-cyber') previewClass = "decor-cyber-animation";
            else if (item.id === 'decor-gold') previewClass = "decor-gold-animation";
            else if (item.id === 'decor-emerald') previewClass = "decor-emerald-animation";
            else if (item.id === 'decor-ruby') previewClass = "decor-ruby-animation";
            else if (item.price === 250) previewStyle = "border: 2px solid #f97316;"; 
            else if (item.price === 500) previewStyle = "border: 2px solid #10b981;"; 

            const isOwned = currentUser && currentUser.inventory.includes(item.title);
            const btnText = isOwned ? "Куплено" : "Купить";
            const btnStyle = isOwned ? "background-color: #27272a; color: #71717a; cursor: not-allowed;" : "";

            card.innerHTML = `
                <div>
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: #1f2937; margin: 0 auto 15px auto; display: flex; align-items: center; justify-content: center; overflow: hidden;" class="${previewClass}" style="${previewStyle}">
                        <span style="font-size: 18px; opacity: 0.3;">✨</span>
                    </div>
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

// ИСПРАВЛЕНО: Теперь эта функция просто открывает красивое окно подтверждения Kristall!
let activePurchaseItem = null; // Запоминаем, какой товар хочет купить юзер

window.buyMarketItem = function(itemName, price, category) {
    if (!currentUser) { showKristallToast("Войдите в Kristall ID, чтобы совершать покупки!", "🔒"); return; }
    if (currentUser.balance < price) { showKristallToast("Недостаточно монет на балансе Kristall ID!", "⏳"); return; }
    if (currentUser.inventory.includes(itemName)) { showKristallToast("Этот предмет уже куплен!", "📦"); return; }

    // Ищем ID товара в нашей скачанной базе, чтобы понять, какую анимацию запустить в превью
    const itemData = allMarketData.find(i => i.title === itemName);
    if (!itemData) return;

    // Сохраняем данные для финальной покупки
    activePurchaseItem = { itemName, price, category };

    // Заполняем тексты в модальном окне
    document.getElementById('modal-product-title').innerText = itemData.title;
    document.getElementById('modal-product-desc').innerText = itemData.desc;

    // Настраиваем "живую" анимацию в левой зоне модалки
    const previewZone = document.getElementById('modal-preview-zone');
    if (previewZone) {
        previewZone.className = ''; // Очищаем старые классы
        previewZone.style.boxShadow = 'none';
        previewZone.style.animation = 'none';
        previewZone.style.borderColor = 'transparent';

        if (itemData.id === 'decor-fire') previewZone.classList.add('decor-fire-animation');
        else if (itemData.id === 'decor-cyber') previewZone.classList.add('decor-cyber-animation');
        else if (itemData.id === 'decor-gold') previewZone.classList.add('decor-gold-animation');
        else if (itemData.id === 'decor-emerald') previewZone.classList.add('decor-emerald-animation');
        else if (itemData.id === 'decor-ruby') previewZone.classList.add('decor-ruby-animation');
        else if (itemData.price === 250) previewZone.style.border = "3px solid #f97316"; // Элита
        else if (itemData.price === 500) previewZone.style.border = "3px solid #10b981"; // Создатель
        else previewZone.style.border = "2px solid #374151";
    }

    // Плавно показываем окно
    document.getElementById('confirm-modal').style.display = 'flex';
};

// Функция финального списания средств (вызывается из app.js при клике на "Подтвердить")
function executeFinalPurchase() {
    if (!activePurchaseItem || !currentUser) return;
    const { itemName, price, category } = activePurchaseItem;

    currentUser.balance -= price;
    currentUser.inventory.push(itemName);

    if (category === 'role') {
        if (itemName.includes("Элита") && currentUser.clearance_level < 2) {
            currentUser.clearance_level = 2;
            showKristallToast("Ваш уровень допуска повышен до Элиты!", "👑");
        } else if (itemName.includes("Создатель") && currentUser.clearance_level < 3) {
            currentUser.clearance_level = 3;
            showKristallToast("Ваш уровень допуска повышен до Создателя!", "👑");
        }
    }

    localStorage.setItem('kristall_user', JSON.stringify(currentUser));
    showKristallToast(`Успешная покупка: ${itemName}!`, "🛒");
    
    // Закрываем окно и обновляем интерфейсы
    document.getElementById('confirm-modal').style.display = 'none';
    activePurchaseItem = null;
    
    if (typeof loadMarketplacePage === 'function') loadMarketplacePage();
    if (typeof updateHeaderProfile === 'function') updateHeaderProfile();
}

// ==========================================================================
// ФУНКЦИЯ ОТРИСОВКИ ВИДЖЕТА НА ГЛАВНОЙ СТРАНИЦЕ (ФИНАЛЬНЫЙ ЗАМЫКАЮЩИЙ БЛОК)
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
    if (typeof applyAvatarBorderColor === 'function') applyAvatarBorderColor();
}
