// ==========================================
// 1. СИСТЕМА КРАСИВЫХ УВЕДОМЛЕНИЙ (КРИСТАЛЛ ТОСТЫ)
// ==========================================

// Заменяем системный alert на плавное выезжающее сверху неоновое окно
function showKristallToast(message, icon = "💎") {
    const toast = document.getElementById('kristall-toast');
    if (!toast) {
        alert(message); // Защита: если тега нет в HTML, сработает обычный алерт
        return;
    }
    
    // Вставляем иконку и текст сообщения
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toast.classList.add('show');

    // Через 3 секунды плавно прячем уведомление обратно вверх
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// 2. СИСТЕМА КАСТОМИЗАЦИИ И АНИМАЦИЙ РАМОК (DISCORD STYLE)
// ==========================================
function applyAvatarBorderColor() {
    if (!currentUser) return;
    
    // Считываем выбор пользователя (или ставим дефолтный циановый неон)
    const selection = currentUser.avatar_color || "#22d3ee";
    
    // Находим все аватарки в шапке сайта и в личном кабинете
    const targets = document.querySelectorAll('#prof-avatar-box img, #prof-avatar-box svg, #header-avatar-img-pc img, #header-avatar-img-pc svg, #header-avatar-img-mobile img, #header-avatar-img-mobile svg');

    targets.forEach(el => {
        if (!el) return;
        
        // Сбрасываем старые анимации и рамки перед наложением новых
        el.className = ''; 
        el.style.boxShadow = 'none';
        el.style.animation = 'none';

        // Проверяем выбранный аксессуар и включаем нужный CSS-класс
        if (selection === 'decor-fire') {
            el.classList.add('decor-fire-animation');
        } else if (selection === 'decor-cyber') {
            el.classList.add('decor-cyber-animation');
        } else if (selection === 'decor-gold') {
            el.classList.add('decor-gold-animation'); // Твой Золотой блеск!
        } else if (selection === 'decor-emerald') {
            el.classList.add('decor-emerald-animation'); // Изумрудный пульс!
        } else if (selection === 'decor-ruby') {
            el.classList.add('decor-ruby-animation'); // Кровавый рубин!
        } else {
            // Если выбран обычный бесплатный цвет — просто красим границу
            el.style.borderColor = selection;
            
            // Если у пользователя в инвентаре лежит Аура — добавляем неоновое свечение к цвету
            if (currentUser.inventory && currentUser.inventory.includes("💥 Неоновая Аура")) {
                el.style.boxShadow = `0 0 15px ${selection}, inset 0 0 10px ${selection}`;
            }
        }
    });

    // ИСПРАВЛЕНО: Теперь точечно находим и красим рамку в боковом виджете на главной странице!
    const sideAvatarContainer = document.querySelector('#main-side-profile div');
    if (sideAvatarContainer) {
        // Очищаем стили контейнера виджета
        sideAvatarContainer.className = '';
        sideAvatarContainer.style.boxShadow = 'none';
        sideAvatarContainer.style.animation = 'none';
        sideAvatarContainer.style.borderColor = 'transparent';

        if (selection === 'decor-fire') {
            sideAvatarContainer.classList.add('decor-fire-animation');
        } else if (selection === 'decor-cyber') {
            sideAvatarContainer.classList.add('decor-cyber-animation');
        } else if (selection === 'decor-gold') {
            sideAvatarContainer.classList.add('decor-gold-animation');
        } else if (selection === 'decor-emerald') {
            sideAvatarContainer.classList.add('decor-emerald-animation');
        } else if (selection === 'decor-ruby') {
            sideAvatarContainer.classList.add('decor-ruby-animation');
        } else {
            // Если выбрана обычная обводка — красим её в цвет звания
            sideAvatarContainer.style.borderColor = selection;
            if (currentUser.inventory && currentUser.inventory.includes("💥 Неоновая Аура")) {
                sideAvatarContainer.style.boxShadow = `0 0 15px ${selection}`;
            }
        }
    }
}

// Функция обновления шапки и цветов никнеймов (ПК и Мобилки)
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

// Заполнение личного кабинета (profile.html)
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

    // Динамический список украшений аватара
    const colorSelect = document.getElementById('edit-avatar-color');
    if (colorSelect) {
        colorSelect.innerHTML = `
            <option value="#22d3ee">Циановый неон (Бесплатно)</option>
            <option value="#f97316">Огненный оранжевый (Бесплатно)</option>
            <option value="#10b981">Изумрудный зелёный (Бесплатно)</option>
            <option value="#a855f7">Магический пурпурный (Бесплатно)</option>
            <option value="#ef4444">Критический красный (Бесплатно)</option>
        `;

        if (currentUser.inventory && currentUser.inventory.includes("🔥 Украшение: Адское Пламя")) {
            colorSelect.innerHTML += `<option value="decor-fire">🔥 Анимация: Адское Пламя</option>`;
        }
        if (currentUser.inventory && currentUser.inventory.includes("⚡ Украшение: Кибер-Импульс")) {
            colorSelect.innerHTML += `<option value="decor-cyber">⚡ Анимация: Кибер-Импульс</option>`;
        }
        if (currentUser.inventory && currentUser.inventory.includes("✨ Украшение: Золотой Блеск")) {
            colorSelect.innerHTML += `<option value="decor-gold">✨ Анимация: Золотой Блеск</option>`;
        }
        if (currentUser.inventory && currentUser.inventory.includes("🟢 Украшение: Изумрудный Пульс")) {
            colorSelect.innerHTML += `<option value="decor-emerald">🟢 Анимация: Изумрудный Пульс</option>`;
        }
        if (currentUser.inventory && currentUser.inventory.includes("🔴 Украшение: Кровавый Рубин")) {
            colorSelect.innerHTML += `<option value="decor-ruby">🔴 Анимация: Кровавый Рубин</option>`;
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

// Функция сохранения настроек профиля
function saveProfileChanges(newName, newAv, newPass, newDesc, newColor) {
    if (!currentUser) return;
    currentUser.username = newName;
    currentUser.avatar_url = newAv;
    currentUser.password = newPass;
    currentUser.description = newDesc;
    currentUser.avatar_color = newColor;
    currentUser.inventory = currentUser.inventory || []; // Защита от стирания!

    localStorage.setItem('kristall_user', JSON.stringify(currentUser));
    showKristallToast("Данные профиля Kristall ID сохранены!", "⚙️");
    buildProfilePage();
    updateHeaderProfile();
}
