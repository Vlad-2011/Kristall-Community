const NEWS_URL = './databases/news.json';
const GAMES_URL = './databases/projects.json'; 
const USERS_URL = './databases/users.json'; 

let allGamesData = []; 
let currentTypeFilter = 'all';
let currentPlatFilter = 'all';
let currentUser = JSON.parse(localStorage.getItem('kristall_user')) || null;

function getRequiredXp(level) {
    return level * 100; 
}

// ФИРМЕННЫЕ ВСПОЛЫВАЮЩИЕ УВЕДОМЛЕНИЯ KRISTALL (БЕЗ ALERT)
function showKristallToast(message, icon = "⚡") {
    const toast = document.getElementById('kristall-toast');
    if (!toast) { return; }
    toast.innerHTML = `<span style="font-size:16px;">${icon}</span> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function localRegister(username, email, password) {
    const newUser = {
        username: username, email: email, password: password,
        role: "Пользователь", clearance_level: 1, level: 1, xp: 0, balance: 0,  
        avatar_url: "", description: "Новобранец KristallCommunity.", inventory: ["👾 Значок Новичка"], avatar_color: "#22d3ee"
    };
    localStorage.setItem('kristall_user', JSON.stringify(newUser));
    currentUser = newUser;
    showKristallToast(`ID для ${username} успешно создан!`, "🎉");
    updateHeaderProfile();
    if (typeof buildProfilePage === 'function') buildProfilePage(); 
    if (typeof buildMainSideProfile === 'function') buildMainSideProfile();
    document.getElementById('auth-modal').style.display = 'none';
}

async function localLogin(email, password) {
    try {
        const response = await fetch(USERS_URL);
        if (response.ok) {
            const usersArray = await response.json();
            const globalUser = usersArray.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            if (globalUser) {
                showKristallToast(`С возвращением, ${globalUser.username}!`, "👑");
                localStorage.setItem('kristall_user', JSON.stringify(globalUser));
                currentUser = globalUser;
                updateHeaderProfile();
                document.getElementById('auth-modal').style.display = 'none';
                window.location.reload(); 
                return;
            }
        }
    } catch (e) { console.warn(" База users.json не найдена, ищем локально..."); }

    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase() && currentUser.password === password) {
        showKristallToast(`С возвращением, ${currentUser.username}!`, "🔑");
        updateHeaderProfile();
        document.getElementById('auth-modal').style.display = 'none';
        window.location.reload();
    } else {
        showKristallToast("Неверная почта или пароль!", "❌");
    }
}
