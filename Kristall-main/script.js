const NEWS_URL = 'databases/news.json';
const GAMES_URL = 'databases/projects.json';

let allGamesData = []; // Сюда сохраним исходный список всех проектов из JSON
let currentTypeFilter = 'all';
let currentPlatFilter = 'all';

// ДИНАМИЧЕСКИЙ ВЫВОД КАРТОЧЕК С ПОИСКОМ И ФИЛЬТРАЦИЕЙ
async function loadProjectsPage() {
    const gridContainer = document.getElementById('projects-grid');
    if (!gridContainer) return;

    try {
        // Скачиваем данные из файла, только если массив пустой (первый запуск)
        if (allGamesData.length === 0) {
            const response = await fetch(GAMES_URL);
            allGamesData = await response.json();
        }

        // Получаем текст из строки поиска
        const searchInput = document.getElementById('search-input');
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';

        gridContainer.innerHTML = ''; // Очищаем каталог перед выводом

        // Фильтруем массив данных по трем условиям одновременно
        const filteredGames = allGamesData.filter(game => {
            const matchesSearch = game.title.toLowerCase().includes(searchText);
            const matchesType = (currentTypeFilter === 'all' || game.type === currentTypeFilter);
            const matchesPlat = (currentPlatFilter === 'all' || game.platform.toLowerCase().includes(currentPlatFilter.toLowerCase()));

            return matchesSearch && matchesType && matchesPlat;
        });

        // Если ничего не нашли
        if (filteredGames.length === 0) {
            gridContainer.innerHTML = '<p style="color: #9ca3af; grid-column: 1/-1;">Ничего не найдено по вашему запросу.</p>';
            return;
        }

        // Строим карточки для отфильтрованных проектов
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
                <div class="card-footer">Подробнее (${game.price}) →</div>
            `;
            gridContainer.appendChild(card);
        });
    } catch (e) {
        console.error("Ошибка загрузки каталога проектов:", e);
        gridContainer.innerHTML = '<p style="color: #ef4444;">Не удалось загрузить каталог приложений.</p>';
    }
}

// НАСТРОЙКА СЛУШАТЕЛЕЙ ДЛЯ КНОПОК И ПОИСКА
function initFiltersAndSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return; // Запускаем только там, где есть поиск (на projects.html)

    // Слушаем ввод текста в строку поиска
    searchInput.addEventListener('input', loadProjectsPage);

    // Настраиваем клики по кнопкам фильтров
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const clickedBtn = e.target;

            // Обработка клика по фильтрам ТИПА (Игры / Приложения)
            if (clickedBtn.hasAttribute('data-filter-type')) {
                document.querySelectorAll('[data-filter-type]').forEach(b => b.classList.remove('active'));
                clickedBtn.classList.add('active');
                currentTypeFilter = clickedBtn.getAttribute('data-filter-type');
            }

            // Обработка клика по фильтрам ПЛАТФОРМЫ (Android / Windows)
            if (clickedBtn.hasAttribute('data-filter-plat')) {
                document.querySelectorAll('[data-filter-plat]').forEach(b => b.classList.remove('active'));
                clickedBtn.classList.add('active');
                currentPlatFilter = clickedBtn.getAttribute('data-filter-plat');
            }

            // Запускаем перерисовку карточек с новыми фильтрами
            loadProjectsPage();
        });
    });
}

// НАПОЛНЕНИЕ СТРАНИЦЫ ШАБЛОНА (PROJECT-TEMPLATE.HTML)
async function buildGameTemplatePage() {
    if (!document.getElementById('game-title')) return;

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');

    if (!gameId) {
        window.location.href = 'projects.html';
        return;
    }

    try {
        const response = await fetch(GAMES_URL);
        const games = await response.json();
        const game = games.find(g => g.id === gameId);

        if (!game) {
            document.getElementById('game-title').innerText = "Проект не найден";
            return;
        }

        // Базовые данные
        document.title = `${game.title} - KristallCommunity`;
        document.getElementById('game-title').innerText = game.title;
        document.getElementById('game-short-desc').innerText = game.short_desc;
        document.getElementById('game-full-desc').innerText = game.full_desc;
        document.getElementById('game-platform').innerText = game.platform;
        document.getElementById('game-version').innerText = game.version;

        // Выводим разработчика проекта из JSON
        document.getElementById('game-developer').innerText = game.developer || "KristallCommunity";

        const downloadBtn = document.getElementById('game-download-btn');
        downloadBtn.href = game.download_path;

        const actionWord = game.type === 'pc' ? 'Скачать для ПК' : 'Скачать APK';
        downloadBtn.innerText = `${actionWord} (${game.price})`;

        // Особенности
        const featuresContainer = document.getElementById('game-features');
        featuresContainer.innerHTML = '';
        game.features.forEach(feat => {
            const li = document.createElement('li');
            li.innerHTML = `<span style="color: #10b981; font-weight: bold; margin-right: 5px;">✔</span> ${feat}`;
            featuresContainer.appendChild(li);
        });

        // ДИНАМИЧЕСКАЯ ИНСТРУКЦИЯ
        const instructionBlock = document.getElementById('instruction-block');
        const instructionList = document.getElementById('instruction-list');

        if (game.show_instruction && instructionBlock && instructionList) {
            instructionBlock.style.display = 'block'; // Показываем блок
            instructionList.innerHTML = ''; // Очищаем

            if (game.instruction_type === 'android') {
                instructionList.innerHTML = `
                    <li>Нажмите зеленую кнопку выше для скачивания файла.</li>
                    <li>Разрешите сохранение файла в системе, если браузер выдаст предупреждение.</li>
                    <li>Откройте скачанный APK на телефоне и в настройках безопасности разрешите <em>"Установку из неизвестных источников"</em>.</li>
                    <li>Завершите процесс установки и запустите игру!</li>
                `;
            } else if (game.instruction_type === 'pc') {
                instructionList.innerHTML = `
                    <li>Скачайте архив с игрой по кнопке выше.</li>
                    <li>Распакуйте скачанный ZIP/RAR архив в любую удобную папку на жестком диске.</li>
                    <li>Найдите файл запуска игры с расширением <strong>.exe</strong> и дважды кликните по нему.</li>
                    <li>Играйте! Рекомендуется создать ярлык на рабочем столе.</li>
                `;
            }
        } else if (instructionBlock) {
            instructionBlock.style.display = 'none'; // Скрываем, если не нужна
        }

    } catch (e) {
        console.error("Ошибка сборки страницы шаблона:", e);
    }
}

// ЗАГРУЗКА НОВОСТЕЙ НА ГЛАВНОЙ (MAIN.HTML)
async function loadNews() {
    const container = document.getElementById('news-container');
    if (!container) return;
    try {
        const response = await fetch(NEWS_URL);
        if (!response.ok) throw new Error();
        const newsData = await response.json();
        container.innerHTML = '';
        newsData.slice(0, 10).forEach(item => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.innerHTML = `<div class="news-date">${item.date}</div><div class="news-title">${item.title}</div><p class="news-text">${item.text}</p>`;
            container.appendChild(newsItem);
        });
    } catch (error) {
        container.innerHTML = '<div class="news-item"><p class="news-text">Не удалось загрузить новости.</p></div>';
    }
}

// УСКОРЕННЫЙ ПАРАЛЛЕЛЬНЫЙ ЗАПУСК
// Promise.all запускает все три функции одновременно, что убирает задержки
// ЗАПУСК ВСЕХ ФУНКЦИЙ И БУРГЕРА ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        loadNews(),
        loadProjectsPage(),
        buildGameTemplatePage()
    ]).then(() => {
        initFiltersAndSearch(); // Запускаем поиск после прогрузки карточек
    }).catch(err => console.error("Ошибка параллельной загрузки:", err));

    // ЛОГИКА АДАПТИВНОГО БУРГЕР-МЕНЮ (ВСТАВИЛИ СЮДА)
    const burgerBtn = document.getElementById('burger-btn');
    const navMenu = document.getElementById('nav-menu');

    if (burgerBtn && navMenu) {
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            burgerBtn.classList.toggle('open');
            navMenu.classList.toggle('open');
        });

        // Автоматически закрывать меню при клике в любое другое место экрана
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !burgerBtn.contains(e.target)) {
                burgerBtn.classList.remove('open');
                navMenu.classList.remove('open');
            }
        });
    }
});
