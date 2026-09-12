let currentUser = null;
let posts = [];
let users = {};          // { username: { password } }
let subscriptions = {};  // { username: [usernames, ...] }
let feedMode = 'all';    // 'all' | 'subs'

// ---------- Утилиты ----------

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function saveSubscriptions() {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
}

function savePosts() {
    localStorage.setItem('posts', JSON.stringify(posts));
}

// ---------- Загрузка данных ----------

window.onload = () => {
    currentUser = localStorage.getItem('currentUser');

    const usersData = localStorage.getItem('users');
    users = usersData ? JSON.parse(usersData) : {};

    const subsData = localStorage.getItem('subscriptions');
    subscriptions = subsData ? JSON.parse(subsData) : {};

    const postsData = localStorage.getItem('posts');
    posts = postsData ? JSON.parse(postsData) : [];

    // Защита от старых записей без новых полей (миграция схемы)
    posts.forEach(p => {
        if (!Array.isArray(p.tags)) p.tags = [];
        if (!Array.isArray(p.comments)) p.comments = [];
        if (!p.visibility) p.visibility = 'public';
        if (!Array.isArray(p.allowedViewers)) p.allowedViewers = [];
        if (!Array.isArray(p.pendingRequests)) p.pendingRequests = [];
    });

    updateUI();
};

// ---------- Формы входа/регистрации ----------

function showRegister() {
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

function hideForms() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('reg-error').textContent = '';
    document.getElementById('login-error').textContent = '';
}

// ---------- Аутентификация ----------

function register() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('reg-error');
    errorEl.textContent = '';

    if (!username || !password) {
        errorEl.textContent = 'Введите имя пользователя и пароль.';
        return;
    }
    if (users[username]) {
        errorEl.textContent = 'Пользователь с таким именем уже существует.';
        return;
    }

    users[username] = { password: password };
    subscriptions[username] = subscriptions[username] || [];
    saveUsers();
    saveSubscriptions();

    currentUser = username;
    localStorage.setItem('currentUser', currentUser);

    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
    alert('Регистрация прошла успешно как ' + username);
    hideForms();
    updateUI();
}

function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    const user = users[username];
    if (!user || user.password !== password) {
        errorEl.textContent = 'Неверное имя пользователя или пароль.';
        return;
    }

    currentUser = username;
    localStorage.setItem('currentUser', currentUser);

    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    alert('Вход выполнен как ' + username);
    hideForms();
    updateUI();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('users-list').style.display = 'none';
    document.getElementById('create-post').style.display = 'none';
    updateUI();
}

// ---------- Общий UI ----------

function updateUI() {
    const authSection = document.getElementById('auth-section');
    const userBar = document.getElementById('user-bar');
    const feedControls = document.getElementById('feed-controls');
    const label = document.getElementById('current-user-label');

    if (currentUser) {
        authSection.style.display = 'none';
        userBar.style.display = 'block';
        feedControls.style.display = 'block';
        label.textContent = 'Вы вошли как: ' + currentUser + '  ';
        renderUsersList();
        populateTagFilter();
        loadPosts();
    } else {
        authSection.style.display = 'block';
        userBar.style.display = 'none';
        feedControls.style.display = 'none';
        document.getElementById('users-list').style.display = 'none';
        document.getElementById('posts').innerHTML = '';
    }
}

// ---------- Подписки ----------

function toggleUsersList() {
    const el = document.getElementById('users-list');
    el.style.display = (el.style.display === 'none') ? 'block' : 'none';
    if (el.style.display === 'block') renderUsersList();
}

function renderUsersList() {
    const container = document.getElementById('users-container');
    container.innerHTML = '';
    const mySubs = subscriptions[currentUser] || [];

    Object.keys(users)
        .filter(u => u !== currentUser)
        .forEach(u => {
            const isSubscribed = mySubs.includes(u);
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `
                <span>${escapeHtml(u)}</span>
                <button onclick="${isSubscribed ? 'unsubscribeFrom' : 'subscribeTo'}('${encodeURIComponent(u)}')">
                    ${isSubscribed ? 'Отписаться' : 'Подписаться'}
                </button>
            `;
            container.appendChild(row);
        });

    if (Object.keys(users).filter(u => u !== currentUser).length === 0) {
        container.innerHTML = '<p>Пока нет других зарегистрированных пользователей.</p>';
    }
}

function subscribeTo(encodedUsername) {
    const username = decodeURIComponent(encodedUsername);
    subscriptions[currentUser] = subscriptions[currentUser] || [];
    if (!subscriptions[currentUser].includes(username)) {
        subscriptions[currentUser].push(username);
        saveSubscriptions();
    }
    renderUsersList();
    if (feedMode === 'subs') loadPosts();
}

function unsubscribeFrom(encodedUsername) {
    const username = decodeURIComponent(encodedUsername);
    subscriptions[currentUser] = (subscriptions[currentUser] || []).filter(u => u !== username);
    saveSubscriptions();
    renderUsersList();
    if (feedMode === 'subs') loadPosts();
}

// ---------- Создание поста ----------

function showCreatePost() {
    document.getElementById('create-post').style.display = 'block';
}

function hideCreatePost() {
    document.getElementById('create-post').style.display = 'none';
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-tags').value = '';
    document.getElementById('post-visibility').value = 'public';
}

function savePost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const tagsRaw = document.getElementById('post-tags').value.trim();
    const visibility = document.getElementById('post-visibility').value;

    if (!title || !content) return;

    const tags = tagsRaw
        ? tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

    const post = {
        id: Date.now(),
        author: currentUser,
        title: title,
        content: content,
        tags: tags,
        visibility: visibility,       // 'public' | 'hidden'
        allowedViewers: [],
        pendingRequests: [],
        comments: []
    };

    posts.push(post);
    savePosts();
    hideCreatePost();
    populateTagFilter();
    loadPosts();
}

// ---------- Лента / фильтры ----------

function setFeedMode(mode) {
    feedMode = mode;
    document.getElementById('tabAll').classList.toggle('active', mode === 'all');
    document.getElementById('tabFeed').classList.toggle('active', mode === 'subs');
    loadPosts();
}

function populateTagFilter() {
    const select = document.getElementById('tag-filter');
    const current = select.value;
    const allTags = new Set();
    posts.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));

    select.innerHTML = '<option value="">Все теги</option>';
    Array.from(allTags).sort().forEach(tag => {
        const opt = document.createElement('option');
        opt.value = tag;
        opt.textContent = tag;
        select.appendChild(opt);
    });
    select.value = allTags.has(current) ? current : '';
}

// Может ли currentUser видеть содержимое конкретного скрытого поста
function canViewHidden(post) {
    return post.author === currentUser || (post.allowedViewers || []).includes(currentUser);
}

function loadPosts() {
    const container = document.getElementById('posts');
    container.innerHTML = '';

    const tagFilter = document.getElementById('tag-filter').value;
    const mySubs = subscriptions[currentUser] || [];

    let visiblePosts = posts.filter(post => {
        // фильтр по режиму ленты
        if (feedMode === 'subs' && post.author !== currentUser && !mySubs.includes(post.author)) {
            return false;
        }
        // в общей ленте показываем публичные посты + скрытые посты, к которым есть доступ
        if (post.visibility === 'hidden' && !canViewHidden(post) && feedMode === 'all') {
            // скрытый пост чужой — покажем в урезанном виде (заголовок + запрос доступа), не скрываем полностью
            return true;
        }
        return true;
    });

    if (tagFilter) {
        visiblePosts = visiblePosts.filter(p => (p.tags || []).includes(tagFilter));
    }

    // Сортировка по тегам: сначала посты с тегами по алфавиту первого тега, затем без тегов, затем по дате
    visiblePosts = visiblePosts.slice().sort((a, b) => {
        const tagA = (a.tags && a.tags.length > 0) ? a.tags[0].toLowerCase() : '';
        const tagB = (b.tags && b.tags.length > 0) ? b.tags[0].toLowerCase() : '';
        
        if (tagA && !tagB) return -1;
        if (!tagA && tagB) return 1;
        if (tagA < tagB) return -1;
        if (tagA > tagB) return 1;
        return b.id - a.id;
    });

    if (visiblePosts.length === 0) {
        container.innerHTML = '<p>Постов пока нет.</p>';
        return;
    }

    visiblePosts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post';

        const isHiddenAndBlocked = post.visibility === 'hidden' && !canViewHidden(post);
        const tagsHtml = (post.tags || [])
            .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
            .join('');

        if (isHiddenAndBlocked) {
            const alreadyRequested = (post.pendingRequests || []).includes(currentUser);
            div.innerHTML = `
                <h3>${escapeHtml(post.title)} <span class="badge">скрытый пост</span></h3>
                <p><strong>Автор:</strong> ${escapeHtml(post.author)}</p>
                <p><em>Содержимое доступно только по запросу.</em></p>
                <button ${alreadyRequested ? 'disabled' : ''} onclick="requestAccess(${post.id})">
                    ${alreadyRequested ? 'Запрос отправлен' : 'Запросить доступ'}
                </button>
            `;
            container.appendChild(div);
            return;
        }

        const ownerControls = (post.author === currentUser) ? `
            <button onclick="editPost(${post.id})">Редактировать</button>
            <button onclick="deletePost(${post.id})">Удалить</button>
        ` : '';

        const pendingHtml = (post.author === currentUser && post.visibility === 'hidden' && post.pendingRequests.length > 0)
            ? `
                <div class="pending-requests">
                    <strong>Запросы на доступ:</strong>
                    ${post.pendingRequests.map(u => `
                        <span>${escapeHtml(u)}
                            <button onclick="approveRequest(${post.id}, '${encodeURIComponent(u)}')">Одобрить</button>
                        </span>
                    `).join('')}
                </div>
            `
            : '';

        div.innerHTML = `
            <h3>${escapeHtml(post.title)} ${post.visibility === 'hidden' ? '<span class="badge">скрытый</span>' : ''}</h3>
            <p><strong>Автор:</strong> ${escapeHtml(post.author)}</p>
            <p>${escapeHtml(post.content)}</p>
            <div class="tags">${tagsHtml}</div>
            ${ownerControls}
            ${pendingHtml}
            <div>
                <h4>Комментарии:</h4>
                ${post.comments.map(c => `<p>${escapeHtml(c)}</p>`).join('')}
                <input type="text" id="comment-input-${post.id}" placeholder="Комментарий" />
                <button onclick="addComment(${post.id})">Добавить комментарий</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ---------- Доступ к скрытым постам ----------

function requestAccess(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    if (!post.pendingRequests.includes(currentUser) && !post.allowedViewers.includes(currentUser)) {
        post.pendingRequests.push(currentUser);
        savePosts();
        loadPosts();
        alert('Запрос на доступ отправлен автору поста.');
    }
}

function approveRequest(id, encodedUsername) {
    const username = decodeURIComponent(encodedUsername);
    const post = posts.find(p => p.id === id);
    if (!post) return;
    post.pendingRequests = post.pendingRequests.filter(u => u !== username);
    if (!post.allowedViewers.includes(username)) {
        post.allowedViewers.push(username);
    }
    savePosts();
    loadPosts();
}

// ---------- Редактирование / удаление ----------

function deletePost(id) {
    const post = posts.find(p => p.id === id);
    if (post && post.author !== currentUser) return; // защита: только автор
    posts = posts.filter(p => p.id !== id);
    savePosts();
    populateTagFilter();
    loadPosts();
}

function editPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post || post.author !== currentUser) return; // защита: только автор

    const newTitle = prompt('Обновить заголовок', post.title);
    const newContent = prompt('Обновить содержание', post.content);
    const newTags = prompt('Обновить теги (через запятую)', (post.tags || []).join(', '));

    if (newTitle !== null && newContent !== null) {
        post.title = newTitle.trim() || post.title;
        post.content = newContent.trim() || post.content;
        if (newTags !== null) {
            post.tags = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
        savePosts();
        populateTagFilter();
        loadPosts();
    }
}

// ---------- Комментарии ----------

function addComment(id) {
    const input = document.getElementById('comment-input-' + id);
    const comment = input.value.trim();
    if (comment) {
        const post = posts.find(p => p.id === id);
        if (post) {
            post.comments.push(comment);
            savePosts();
            loadPosts();
        }
    }
}