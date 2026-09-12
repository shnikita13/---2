// Начальная база данных любимых книг
const initialBooks = [
    { id: 1, title: "Мастер и Маргарита", author: "Михаил Булгаков", category: "Классика", year: 1940, price: 600, status: "available" },
    { id: 2, title: "1984", author: "Джордж Оруэлл", category: "Фантастика", year: 1949, price: 500, status: "available" },
    { id: 3, title: "Преступление и наказание", author: "Фёдор Достоевский", category: "Классика", year: 1866, price: 550, status: "available" },
    { id: 4, title: "Дюна", author: "Фрэнк Герберт", category: "Фантастика", year: 1965, price: 800, status: "available" },
    { id: 5, title: "Чистый код", author: "Роберт Мартин", category: "Программирование", year: 2008, price: 1200, status: "available" }
];

let books = [];
let rentals = []; // [{ id, userName, bookTitle, startDate, endDate, notified }]
let activeBookForAction = null;

window.onload = () => {
    const localBooks = localStorage.getItem('store_books');
    books = localBooks ? JSON.parse(localBooks) : initialBooks;
    if (!localBooks) saveBooks();

    const localRentals = localStorage.getItem('store_rentals');
    rentals = localRentals ? JSON.parse(localRentals) : [];

    populateFilters();
    renderUserBooks();
};

function saveBooks() {
    localStorage.setItem('store_books', JSON.stringify(books));
}

function saveRentals() {
    localStorage.setItem('store_rentals', JSON.stringify(rentals));
}

// Переключение интерфейсов (Пользователь / Админ)
function switchRole(role) {
    document.getElementById('btnRoleUser').classList.toggle('active', role === 'user');
    document.getElementById('btnRoleAdmin').classList.toggle('active', role === 'admin');
    
    document.getElementById('user-interface').style.display = (role === 'user') ? 'block' : 'none';
    document.getElementById('admin-interface').style.display = (role === 'admin') ? 'block' : 'none';

    if (role === 'admin') {
        renderAdminBooks();
        renderAdminRentals();
    } else {
        populateFilters();
        renderUserBooks();
    }
}

// ---------- ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС ----------

function populateFilters() {
    const categorySelect = document.getElementById('filter-category');
    const authorSelect = document.getElementById('filter-author');

    const categories = [...new Set(books.map(b => b.category))];
    const authors = [...new Set(books.map(b => b.author))];

    categorySelect.innerHTML = '<option value="">Все категории</option>' + 
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
    authorSelect.innerHTML = '<option value="">Все авторы</option>' + 
        authors.map(a => `<option value="${a}">${a}</option>`).join('');
}

function renderUserBooks() {
    const grid = document.getElementById('user-books-grid');
    grid.innerHTML = '';

    const catFilter = document.getElementById('filter-category').value;
    const authorFilter = document.getElementById('filter-author').value;
    const sortYear = document.getElementById('sort-year').value;

    let filtered = books.filter(b => {
        if (catFilter && b.category !== catFilter) return false;
        if (authorFilter && b.author !== authorFilter) return false;
        return true;
    });

    filtered.sort((a, b) => sortYear === 'asc' ? a.year - b.year : b.year - a.year);

    if (filtered.length === 0) {
        grid.innerHTML = '<p>Книги не найдены.</p>';
        return;
    }

    filtered.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <h3>${escapeHtml(book.title)}</h3>
            <p><strong>Автор:</strong> ${escapeHtml(book.author)}</p>
            <p><strong>Категория:</strong> ${escapeHtml(book.category)}</p>
            <p><strong>Год:</strong> ${book.year}</p>
            <p><strong>Цена:</strong> ${book.price} руб.</p>
            <p><strong>Статус:</strong> <span class="${book.status}">${book.status === 'available' ? 'В наличии' : 'Нет в наличии'}</span></p>
            ${book.status === 'available' ? `<button onclick="openModal(${book.id})">Купить / Арендовать</button>` : '<button disabled>Недоступна</button>'}
        `;
        grid.appendChild(card);
    });
}

function openModal(bookId) {
    activeBookForAction = books.find(b => b.id === bookId);
    if (!activeBookForAction) return;

    document.getElementById('modal-book-title').textContent = activeBookForAction.title;
    document.getElementById('modal-book-info').textContent = `${activeBookForAction.author} (${activeBookForAction.price} руб.)`;
    document.getElementById('modal-action').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-action').style.display = 'none';
    activeBookForAction = null;
}

function toggleRentalOptions() {
    const isRent = document.querySelector('input[name="actionType"]:checked').value === 'rent';
    document.getElementById('rental-options').style.display = isRent ? 'block' : 'none';
}

function confirmTransaction() {
    const userName = document.getElementById('user-name-input').value.trim();
    if (!userName) {
        alert('Пожалуйста, введите ваше имя!');
        return;
    }

    const actionType = document.querySelector('input[name="actionType"]:checked').value;

    if (actionType === 'buy') {
        alert(`Спасибо, ${userName}! Вы успешно купили книгу "${activeBookForAction.title}".`);
    } else {
        const period = document.getElementById('rent-period').value;
        const now = new Date();
        let endDate = new Date();

        if (period === '2weeks') endDate.setDate(now.getDate() + 14);
        if (period === '1month') endDate.setMonth(now.getMonth() + 1);
        if (period === '3months') endDate.setMonth(now.getMonth() + 3);

        rentals.push({
            id: Date.now(),
            userName: userName,
            bookTitle: activeBookForAction.title,
            startDate: now.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            notified: false
        });
        saveRentals();
        alert(`Книга "${activeBookForAction.title}" арендована пользователем ${userName} до ${endDate.toISOString().split('T')[0]}.`);
    }

    closeModal();
}

// ---------- АДМИНИСТРАТИВНЫЙ ИНТЕРФЕЙС ----------

function renderAdminBooks() {
    const tbody = document.getElementById('admin-books-table');
    tbody.innerHTML = '';

    books.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${b.id}</td>
            <td>${escapeHtml(b.title)}</td>
            <td>${escapeHtml(b.author)}</td>
            <td>${escapeHtml(b.category)}</td>
            <td>${b.year}</td>
            <td>${b.price} руб.</td>
            <td>${b.status === 'available' ? 'В наличии' : 'Нет в наличии'}</td>
            <td>
                <button onclick="editBook(${b.id})">Ред.</button>
                <button onclick="deleteBook(${b.id})">Удалить</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function saveBook(e) {
    e.preventDefault();
    const id = document.getElementById('admin-book-id').value;
    const title = document.getElementById('admin-title').value.trim();
    const author = document.getElementById('admin-author').value.trim();
    const category = document.getElementById('admin-category').value.trim();
    const year = parseInt(document.getElementById('admin-year').value);
    const price = parseFloat(document.getElementById('admin-price').value);
    const status = document.getElementById('admin-status').value;

    if (id) {
        const book = books.find(b => b.id === parseInt(id));
        if (book) {
            Object.assign(book, { title, author, category, year, price, status });
        }
    } else {
        books.push({ id: Date.now(), title, author, category, year, price, status });
    }

    saveBooks();
    resetAdminForm();
    renderAdminBooks();
}

function editBook(id) {
    const b = books.find(item => item.id === id);
    if (!b) return;

    document.getElementById('admin-book-id').value = b.id;
    document.getElementById('admin-title').value = b.title;
    document.getElementById('admin-author').value = b.author;
    document.getElementById('admin-category').value = b.category;
    document.getElementById('admin-year').value = b.year;
    document.getElementById('admin-price').value = b.price;
    document.getElementById('admin-status').value = b.status;
}

function deleteBook(id) {
    if (confirm('Удалить эту книгу из каталога?')) {
        books = books.filter(b => b.id !== id);
        saveBooks();
        renderAdminBooks();
    }
}

function resetAdminForm() {
    document.getElementById('book-form').reset();
    document.getElementById('admin-book-id').value = '';
}

function renderAdminRentals() {
    const tbody = document.getElementById('admin-rentals-table');
    tbody.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];

    rentals.forEach(r => {
        const isExpired = r.endDate < today;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(r.userName)}</td>
            <td>${escapeHtml(r.bookTitle)}</td>
            <td>${r.startDate}</td>
            <td>${r.endDate}</td>
            <td>${isExpired ? '<span class="expired">Истёк</span>' : '<span class="active-rent">Активна</span>'}</td>
            <td>
                <button onclick="sendManualNotification(${r.id})">Напомнить</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Автоматическая проверка и отправка напоминаний
function checkRentalNotifications() {
    const log = document.getElementById('notifications-log');
    log.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    let count = 0;

    rentals.forEach(r => {
        if (r.endDate <= today) {
            count++;
            const msg = `[АВТО-НАПОМИНАНИЕ] Пользователю "${r.userName}": Срок аренды книги "${r.bookTitle}" истёк (${r.endDate}). Пожалуйста, верните книгу!`;
            log.innerHTML += `<p>${msg}</p>`;
            r.notified = true;
        }
    });

    if (count === 0) {
        log.innerHTML = '<p>Просроченных аренд не обнаружено.</p>';
    }
    saveRentals();
    renderAdminRentals();
}

function sendManualNotification(rentalId) {
    const r = rentals.find(item => item.id === rentalId);
    if (r) {
        alert(`Напоминание отправлено пользователю ${r.userName} по книге "${r.bookTitle}".`);
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}