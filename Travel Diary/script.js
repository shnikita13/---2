let currentUser = null;
let trips = [];
let users = {};

// Начальные демо-данные
const initialTrips = [
    {
        id: 1,
        author: "admin",
        title: "Прогулка по Санкт-Петербургу",
        location: "Санкт-Петербург, Россия (59.934, 30.335)",
        image: "https://images.unsplash.com/photo-1556610961-2fe33123f890?w=500",
        cost: 25000,
        sights: "Эрмитаж, Невский проспект, Исаакиевский собор",
        ratings: { safety: 5, transport: 5, nature: 4 }
    }
];

window.onload = () => {
    currentUser = localStorage.getItem('journal_currentUser');
    
    const localUsers = localStorage.getItem('journal_users');
    users = localUsers ? JSON.parse(localUsers) : { "admin": "admin" };

    const localTrips = localStorage.getItem('journal_trips');
    trips = localTrips ? JSON.parse(localTrips) : initialTrips;
    if (!localTrips) saveTrips();

    updateUI();
};

function saveTrips() {
    localStorage.setItem('journal_trips', JSON.stringify(trips));
}

function saveUsers() {
    localStorage.setItem('journal_users', JSON.stringify(users));
}

// ---------- АУТЕНТИФИКАЦИЯ ----------

let authMode = 'login';

function showAuthModal(mode) {
    authMode = mode;
    document.getElementById('auth-title').textContent = mode === 'login' ? 'Вход' : 'Регистрация';
    document.getElementById('modal-auth').style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('modal-auth').style.display = 'none';
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
}

function handleAuth() {
    const u = document.getElementById('auth-username').value.trim();
    const p = document.getElementById('auth-password').value.trim();

    if (!u || !p) {
        alert('Заполните все поля!');
        return;
    }

    if (authMode === 'register') {
        if (users[u]) {
            alert('Пользователь с таким именем уже существует!');
            return;
        }
        users[u] = p;
        saveUsers();
        currentUser = u;
    } else {
        if (!users[u] || users[u] !== p) {
            alert('Неверный логин или пароль!');
            return;
        }
        currentUser = u;
    }

    localStorage.setItem('journal_currentUser', currentUser);
    closeAuthModal();
    updateUI();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('journal_currentUser');
    updateUI();
}

// ---------- ИНТЕРФЕЙС ----------

function updateUI() {
    const userDisplay = document.getElementById('user-display');
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const btnLogout = document.getElementById('btn-logout');
    const btnAddTrip = document.getElementById('btn-add-trip');
    const tabMy = document.getElementById('tab-my');

    if (currentUser) {
        userDisplay.textContent = `Привет, ${currentUser}!`;
        btnLogin.style.display = 'none';
        btnRegister.style.display = 'none';
        btnLogout.style.display = 'inline-block';
        btnAddTrip.style.display = 'inline-block';
        tabMy.style.display = 'inline-block';
    } else {
        userDisplay.textContent = '';
        btnLogin.style.display = 'inline-block';
        btnRegister.style.display = 'inline-block';
        btnLogout.style.display = 'none';
        btnAddTrip.style.display = 'none';
        tabMy.style.display = 'none';
        switchTab('all');
    }

    renderTrips();
}

let activeTab = 'all';

function switchTab(tab) {
    activeTab = tab;
    document.getElementById('tab-all').classList.toggle('active', tab === 'all');
    document.getElementById('tab-my').classList.toggle('active', tab === 'my');
    renderTrips();
}

// ---------- ПУБЛИКАЦИИ ----------

function renderTrips() {
    const grid = document.getElementById('trips-grid');
    grid.innerHTML = '';

    let list = trips;
    if (activeTab === 'my') {
        list = trips.filter(t => t.author === currentUser);
    }

    if (list.length === 0) {
        grid.innerHTML = '<p>Записей пока нет.</p>';
        return;
    }

    list.forEach(t => {
        const card = document.createElement('div');
        card.className = 'trip-card';
        card.innerHTML = `
            <img src="${escapeHtml(t.image)}" alt="${escapeHtml(t.title)}" class="trip-img" onerror="this.src='https://via.placeholder.com/300x180?text=Нет+фото'"/>
            <div class="trip-body">
                <h3>${escapeHtml(t.title)}</h3>
                <p class="author">Автор: <strong>${escapeHtml(t.author)}</strong></p>
                <p>📍 <strong>Геопозиция:</strong> ${escapeHtml(t.location)}</p>
                <p>💰 <strong>Стоимость:</strong> ${t.cost} руб.</p>
                <p>🏛 <strong>Места культурного наследия:</strong> ${escapeHtml(t.sights)}</p>
                <div class="ratings">
                    <span>🛡 Безопасность: ${t.ratings.safety}/5</span> |
                    <span>🚗 Удобство: ${t.ratings.transport}/5</span> |
                    <span>🌿 Природа: ${t.ratings.nature}/5</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openTripModal() {
    document.getElementById('modal-trip').style.display = 'flex';
}

function closeTripModal() {
    document.getElementById('modal-trip').style.display = 'none';
    document.getElementById('trip-form').reset();
}

function saveTrip(e) {
    e.preventDefault();
    
    const newTrip = {
        id: Date.now(),
        author: currentUser,
        title: document.getElementById('trip-title').value.trim(),
        location: document.getElementById('trip-location').value.trim(),
        image: document.getElementById('trip-image').value.trim(),
        cost: parseFloat(document.getElementById('trip-cost').value),
        sights: document.getElementById('trip-sights').value.trim(),
        ratings: {
            safety: parseInt(document.getElementById('rate-safety').value),
            transport: parseInt(document.getElementById('rate-transport').value),
            nature: parseInt(document.getElementById('rate-nature').value)
        }
    };

    trips.unshift(newTrip);
    saveTrips();
    closeTripModal();
    renderTrips();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}