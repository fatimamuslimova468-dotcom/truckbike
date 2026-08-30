import {
  watchAuth,
  signUp,
  signIn,
  resetPassword,
  signOutCurrentUser,
  ensureUserDocument,
  loadProducts,
  loadCategories,
  loadUserState,
  saveUserState,
  loadOrders,
  createOrder,
  createSupportTicket,
  loadSupportTickets,
  updateAuthDisplayName,
  resendVerification,
  beginTotpEnrollment,
  finishTotpEnrollment,
  disableTotpEnrollment,
  getEnrolledTotpFactors,
  resolveTotpSignIn
} from './firebase.js';

const state = {
  route: 'home',
  payload: '',
  previousRoute: 'home',
  query: '',
  category: 'Все',
  sort: 'popular',
  favorites: [],
  cart: [],
  orders: [],
  addresses: [],
  cards: [],
  profile: {},
  user: null,
  categories: [],
  products: [],
  promo: '',
  selectedSize: '',
  supportTickets: [],
  orderFilter: 'all',
  booting: true
};

const fallbackCategories = [
  ['Питбайки 110cc', '110cc'],
  ['Питбайки 125cc', '125cc'],
  ['Питбайки 140cc', '140cc'],
  ['Питбайки 150cc', '150cc'],
  ['Мини-кросс', 'mini'],
  ['Электропитбайки', 'electric']
];

const screen = document.querySelector('#screen');
const modalRoot = document.querySelector('#modalRoot');
const toast = document.querySelector('#toast');

function icon(name, size = 20) {
  const icons = {
    home: '<path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.2"/><path d="m15 15 5 5"/>',
    cart: '<path d="M4 5h2l1.2 9.2a2 2 0 0 0 2 1.8h6.7a2 2 0 0 0 2-1.7L19 8H7"/><circle cx="10" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>',
    orders: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    heart: '<path d="M20.2 8.8c0 5.1-8.2 10.2-8.2 10.2S3.8 13.9 3.8 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.2 2.7Z"/>',
    user: '<circle cx="12" cy="8" r="3.3"/><path d="M5.5 20c.8-3.8 3.1-5.6 6.5-5.6s5.7 1.8 6.5 5.6"/>',
    settings: '<path d="M12 3.6v2.1m0 12.6v2.1M3.6 12h2.1m12.6 0h2.1M5.9 5.9l1.5 1.5m9.2 9.2 1.5 1.5m0-12.2-1.5 1.5m-9.2 9.2-1.5 1.5"/><circle cx="12" cy="12" r="3.4"/>',
    bell: '<path d="M5.7 10.2c0-3.4 2.1-5.7 6.3-5.7s6.3 2.3 6.3 5.7c0 5 1.5 6.3 1.5 6.3H4.2s1.5-1.3 1.5-6.3Z"/><path d="M10 20h4"/>',
    back: '<path d="m15 5-7 7 7 7"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    trash: '<path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v6M14 11v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
    pin: '<path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.2"/>',
    card: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M3.5 10h17"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.6A2.4 2.4 0 0 1 12 7.7c1.6 0 2.6 1 2.6 2.2 0 1.5-1.2 2-2.1 2.8-.6.5-.8.9-.8 1.7"/><circle cx="12" cy="17.2" r=".8" fill="currentColor" stroke="none"/>',
    logout: '<path d="M10 5H5v14h5M15 8l4 4-4 4M19 12H9"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    share: '<circle cx="18" cy="5" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="m8 11 7.8-4.4M8 13l7.8 4.5"/>',
    support: '<path d="M5.5 12a6.5 6.5 0 0 1 13 0v3.2a2 2 0 0 1-2 2h-1.7v-4h2.6M5.5 13.2H8v4H6.5a2 2 0 0 1-2-2V12"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>'
  };
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.grid}</svg>`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function money(value) {
  return `${new Intl.NumberFormat('ru-RU').format(Number(value) || 0)} ₽`;
}

function dateText(value) {
  if (!value) return 'Сегодня';
  if (typeof value.toDate === 'function') return value.toDate().toLocaleString('ru-RU');
  return String(value);
}

function productById(id) {
  return state.products.find((product) => String(product.id) === String(id));
}

function cartCount() {
  return state.cart.reduce((sum, row) => sum + Number(row.qty || 0), 0);
}

function cartTotal() {
  return state.cart.reduce((sum, row) => {
    const product = productById(row.id);
    return sum + (product ? Number(product.price) * row.qty : 0);
  }, 0);
}

function isFavorite(id) {
  return state.favorites.some((favorite) => String(favorite) === String(id));
}

function cartItem(id) {
  return state.cart.find((item) => String(item.id) === String(id));
}

function cartButtonLabel(id) {
  const item = cartItem(id);
  return item ? `В корзине · ${item.qty}` : 'В корзину';
}

function syncCartButtons(id) {
  const item = cartItem(id);
  document.querySelectorAll('[data-add]').forEach((button) => {
    if (String(button.dataset.add) !== String(id)) return;
    button.textContent = item ? `В корзине · ${item.qty}` : 'В корзину';
    button.classList.toggle('in-cart', Boolean(item));
    button.setAttribute('aria-label', item ? `Товар уже в корзине, количество ${item.qty}` : 'Добавить в корзину');
  });
}

function toastMsg(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__truckToast);
  window.__truckToast = setTimeout(() => toast.classList.remove('show'), 2200);
}

function updateBadges() {
  const count = cartCount();
  document.querySelectorAll('[data-cart-badge]').forEach((node) => {
    node.textContent = count || '';
    node.classList.toggle('visible', count > 0);
  });
}

function syncProfileChrome() {
  const name = state.profile?.name || state.user?.displayName || (state.user?.email ? state.user.email.split('@')[0] : 'Пользователь');
  const sidebar = document.querySelector('#sidebarProfileName');
  const header = document.querySelector('#headerProfileName');
  if (sidebar) sidebar.textContent = name;
  if (header) header.textContent = name;
  document.querySelectorAll('.profile-trigger .avatar, .sidebar-account .avatar').forEach((avatar) => {
    avatar.textContent = name.slice(0, 2).toUpperCase();
  });
}

function setNav() {
  document.querySelectorAll('[data-route]').forEach((node) => {
    node.classList.toggle('active', node.dataset.route === state.route);
  });
}

function go(route, payload = '') {
  if (state.route !== route) state.previousRoute = state.route;
  state.route = route;
  state.payload = payload;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function persist() {
  if (!state.user) return;
  await saveUserState(state.user.uid, {
    favorites: state.favorites,
    cart: state.cart,
    addresses: state.addresses,
    cards: state.cards,
    profile: state.profile
  });
  updateBadges();
}

function setupChrome() {
  const side = document.querySelector('#desktopNav');
  const account = document.querySelector('#accountNav');
  const bottom = document.querySelector('#bottomNav');
  side.innerHTML = [
    ['home', 'Главная', 'home'], ['categories', 'Каталог', 'grid'], ['search', 'Поиск', 'search'],
    ['cart', 'Корзина', 'cart'], ['orders', 'Заказы', 'orders']
  ].map(([route, label, ico]) => `<button class="sidebar-link" data-route="${route}"><span class="sidebar-icon">${icon(ico, 18)}</span><span>${label}</span>${route === 'cart' ? '<b class="count-badge" data-cart-badge></b>' : ''}</button>`).join('');
  account.innerHTML = [
    ['favorites', 'Избранное', 'heart'], ['profile', 'Профиль', 'user'], ['settings', 'Настройки', 'settings']
  ].map(([route, label, ico]) => `<button class="sidebar-link" data-route="${route}"><span class="sidebar-icon">${icon(ico, 18)}</span><span>${label}</span></button>`).join('');
  bottom.innerHTML = [
    ['home', 'Главная', 'home'], ['search', 'Поиск', 'search'], ['cart', 'Корзина', 'cart'], ['orders', 'Заказы', 'orders'], ['profile', 'Профиль', 'user']
  ].map(([route, label, ico]) => `<button class="nav-item" data-route="${route}"><span>${icon(ico, 19)}</span><small>${label}</small>${route === 'cart' ? '<b class="count-badge" data-cart-badge></b>' : ''}</button>`).join('');
  document.querySelector('#backBtn').innerHTML = icon('back', 21);
  document.querySelector('#notifyBtn').innerHTML = icon('bell', 19);
  document.querySelector('#desktopSearchIcon').innerHTML = icon('search', 18);
  document.querySelector('#desktopCartIcon').innerHTML = icon('cart', 19);
}

function catIcon() {
  return `<svg viewBox="0 0 72 48" class="pitbike-icon" aria-hidden="true"><circle cx="16" cy="35" r="9"/><circle cx="55" cy="35" r="9"/><path d="M16 35 26 18h12l8 17M26 18l-4-9h11l6 9m-13 0 9 14h13l6-11"/><path d="m39 18 6-7h8"/><path d="M31 12h-7"/></svg>`;
}

function productCard(product, index = 0) {
  const liked = isFavorite(product.id);
  return `<article class="product-card" data-open-product="${esc(product.id)}" style="animation-delay:${Math.min(index, 8) * 45}ms">
    <div class="product-visual"><button class="fav ${liked ? 'active' : ''}" data-fav="${esc(product.id)}" aria-label="Избранное">${icon('heart', 17)}</button><img src="${esc(product.image || '')}" alt="${esc(product.name)}" loading="lazy"></div>
    <h3>${esc(product.name)}</h3><div class="meta"><span>${esc(product.cat || '')}</span><span class="rating">★ ${esc(product.rating || 0)}</span></div>
    <div class="price-line"><span class="price">${money(product.price)}</span>${product.old ? `<span class="old">${money(product.old)}</span>` : ''}</div>
    <div class="card-actions"><button class="icon-box favorite-btn ${liked ? 'active' : ''}" data-fav="${esc(product.id)}" aria-label="${liked ? 'Убрать из избранного' : 'Добавить в избранное'}">${icon('heart', 17)}</button><button class="add-btn ${cartItem(product.id) ? 'in-cart' : ''}" data-add="${esc(product.id)}">${cartButtonLabel(product.id)}</button></div>
  </article>`;
}

function home() {
  const cats = state.categories.length ? state.categories : fallbackCategories.map(([name, key]) => ({ name, key }));
  screen.innerHTML = `<div class="container">
    <section class="hero"><div class="hero-copy"><div class="hero-kicker">Truck Bike · сезон 2026</div><h1>Новые <span>питбайки</span><br>для твоего пути</h1><p>110–150cc, мини-кросс и электропитбайки. Подберём технику под твой стиль катания.</p><div class="hero-buttons"><button class="btn" data-route="search">Смотреть каталог</button><button class="btn ghost" data-route="categories">Все категории</button></div></div></section>
    <button class="searchbar" data-route="search"><span>${icon('search', 18)}</span><span class="muted">Поиск питбайков, запчастей и экипировки</span></button>
    <div class="section-head"><h2>Популярные категории</h2><button class="link-btn" data-route="categories">Все категории</button></div>
    <div class="cats">${cats.slice(0, 6).map((cat) => `<button class="cat" data-category="${esc(cat.name || cat)}"><span class="cat-icon">${catIcon()}</span><small>${esc((cat.name || cat).replace('Питбайки ', ''))}</small></button>`).join('')}</div>
    <div class="section-head"><h2>Популярные модели</h2><button class="link-btn" data-route="search">Смотреть все</button></div>
    <div class="products">${state.products.slice(0, 6).map((p, i) => productCard(p, i)).join('')}</div>
  </div>`;
}

function search() {
  screen.innerHTML = `<div class="container"><h1 class="page-title">Поиск</h1><div class="search-toolbar"><div class="searchbar" style="margin:0"><span>${icon('search', 17)}</span><input id="searchInput" value="${esc(state.query)}" placeholder="Введите название, модель или категорию..."></div><button class="chip" id="clearSearch">Очистить</button><select class="select" id="sort"><option value="popular">Популярные</option><option value="priceAsc">Сначала дешевле</option><option value="priceDesc">Сначала дороже</option><option value="rating">По рейтингу</option></select></div><div class="filters" style="margin-top:11px"><button class="chip ${state.category === 'Все' ? 'active' : ''}" data-cat-filter="Все">Все</button>${state.products.map((p) => p.cat).filter((value, index, arr) => value && arr.indexOf(value) === index).map((cat) => `<button class="chip ${state.category === cat ? 'active' : ''}" data-cat-filter="${esc(cat)}">${esc(cat.replace('Питбайки ', ''))}</button>`).join('')}</div><div id="results"></div></div>`;
  document.querySelector('#sort').value = state.sort;
  updateResults();
}

function updateResults() {
  let items = [...state.products];
  const query = state.query.trim().toLowerCase();
  if (query) items = items.filter((p) => `${p.name} ${p.cat} ${p.color}`.toLowerCase().includes(query));
  if (state.category !== 'Все') items = items.filter((p) => p.cat === state.category);
  if (state.sort === 'priceAsc') items.sort((a, b) => a.price - b.price);
  if (state.sort === 'priceDesc') items.sort((a, b) => b.price - a.price);
  if (state.sort === 'rating') items.sort((a, b) => b.rating - a.rating);
  document.querySelector('#results').innerHTML = `<div class="results-info">Найдено: ${items.length}</div>${items.length ? `<div class="products">${items.map((p, i) => productCard(p, i)).join('')}</div>` : `<div class="empty"><div class="empty-icon">${icon('search', 25)}</div><h2>Ничего не нашли</h2><p class="muted">Попробуй другое название.</p><button class="btn" id="resetFilters">Сбросить фильтры</button></div>`}`;
}

function categoriesPage() {
  const cats = state.categories.length ? state.categories : fallbackCategories.map(([name, key]) => ({ name, key }));
  screen.innerHTML = `<div class="container"><h1 class="page-title">Каталог</h1><div class="cats categories-grid">${cats.map((cat) => `<button class="cat" data-category="${esc(cat.name)}"><span class="cat-icon">${catIcon()}</span><small>${esc(cat.name)}</small><span class="muted" style="font-size:10px">${esc(cat.count || 0)} моделей</span></button>`).join('')}</div></div>`;
}

function productPage(id) {
  const product = productById(id);
  if (!product) return go('search');
  const liked = isFavorite(product.id);
  state.selectedSize = state.selectedSize || product.sizes?.[0] || '';
  screen.innerHTML = `<div class="container"><div class="detail"><div class="detail-gallery"><div class="detail-main"><img src="${esc(product.image)}" alt="${esc(product.name)}"></div></div><div class="detail-side"><div class="eyebrow">${esc(product.cat)} · Арт. ${esc(product.id)}</div><h1>${esc(product.name)}</h1><div class="detail-rating"><span class="rating">★ ${esc(product.rating)}</span><span>${esc(product.reviews || 0)} отзывов</span><span class="status">В наличии</span></div><div class="big-price">${money(product.price)}</div><div class="detail-old">${product.old ? money(product.old) : ''}</div><div class="option-label">Размер колёс</div><div class="sizes">${(product.sizes || []).map((size) => `<button class="size ${state.selectedSize === size ? 'selected' : ''}" data-size="${esc(size)}">${esc(size)}</button>`).join('')}</div><div class="detail-actions"><button class="btn ${cartItem(product.id) ? 'in-cart' : ''}" data-add="${esc(product.id)}">${icon('cart', 17)}&nbsp; ${cartButtonLabel(product.id)}</button><button class="btn dark" data-quick-buy="${esc(product.id)}">Купить в 1 клик</button></div><div class="specs"><div class="spec"><b>Доставка</b><span>${esc(product.delivery || '2 дня')}</span></div><div class="spec"><b>На складе</b><span>${esc(product.stock || 0)} шт.</span></div><div class="spec"><b>Двигатель</b><span>${esc(product.cat || 'Питбайк')}</span></div><div class="spec"><b>Гарантия</b><span>2 года</span></div></div><button class="btn ghost full favorite-full ${liked ? 'active' : ''}" data-fav="${esc(product.id)}">${icon('heart', 17)}&nbsp; ${liked ? 'В избранном' : 'Добавить в избранное'}</button></div></div></div>`;
}

function cartPage() {
  if (!state.cart.length) {
    screen.innerHTML = `<div class="container"><h1 class="page-title">Корзина</h1><div class="empty"><div class="empty-icon">${icon('cart', 27)}</div><h2>Корзина пока пуста</h2><p class="muted">Добавь питбайк из каталога.</p><button class="btn" data-route="search">Перейти в каталог</button></div></div>`;
    return;
  }
  const subtotal = cartTotal();
  const discount = state.promo === 'TRUCK10' ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;
  const rows = state.cart.map((row) => {
    const product = productById(row.id);
    if (!product) return '';
    return `<div class="cart-item"><div class="cart-thumb"><img src="${esc(product.image)}" alt=""></div><div class="cart-info"><h3>${esc(product.name)}</h3><div class="cart-color">${esc(product.color || '')} · ${money(product.price)}</div><div class="qty"><button data-qty="${esc(product.id)}" data-d="-1">${icon('minus', 15)}</button><b>${row.qty}</b><button data-qty="${esc(product.id)}" data-d="1">${icon('plus', 15)}</button><button class="remove" data-remove="${esc(product.id)}">Удалить</button></div></div><b>${money(product.price * row.qty)}</b></div>`;
  }).join('');
  screen.innerHTML = `<div class="container"><div class="cart-layout"><div><h1 class="page-title">Корзина <span class="muted" style="font-size:14px">${cartCount()} шт.</span></h1><div class="cart-list">${rows}</div></div><aside class="summary"><h3>Ваш заказ</h3><div class="sum-row"><span>Товары</span><b>${money(subtotal)}</b></div><div class="sum-row"><span>Скидка</span><b>${discount ? '-' + money(discount) : '—'}</b></div><div class="sum-row"><span>Доставка</span><b>Бесплатно</b></div><div class="promo"><input id="promoInput" value="${esc(state.promo)}" placeholder="Промокод"><button class="btn small" id="promoBtn">Применить</button></div>${discount ? '<div class="notice">TRUCK10 применён · −10%</div>' : ''}<div class="sum-row sum-total"><span>Итого</span><b>${money(total)}</b></div><button class="btn full" data-route="checkout">Оформить заказ</button></aside></div></div>`;
}

function checkout() {
  if (!state.cart.length) return go('cart');
  const subtotal = cartTotal();
  const discount = state.promo === 'TRUCK10' ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;
  screen.innerHTML = `<div class="container"><div class="settings-wrap"><h1 class="page-title">Оформление заказа</h1><div class="address-card"><div class="menu-left">${icon('pin', 18)}<b>Доставка</b></div><p>${esc(state.addresses[0]?.address || 'Адрес не выбран')}</p><span class="muted">Город: ${esc(state.profile.city || 'не выбран')}</span><span class="muted">${state.addresses.length ? 'Курьерская доставка' : 'Добавь адрес в профиле'}</span></div><div class="payment-card"><div class="menu-left">${icon('card', 18)}<b>Оплата</b></div><p>${state.profile.preferredPayment === 'sbp' ? 'СБП' : state.profile.preferredPayment === 'cash' ? 'При получении' : (state.cards[0] ? esc(`${state.cards[0].brand || 'Карта'} •••• ${state.cards[0].last4}`) : 'Банковская карта')}</p><span class="muted">${state.profile.preferredPayment === 'card' && state.cards.length ? 'Сохранённая карта' : 'Выбранный способ оплаты'}</span></div><div class="summary" style="position:static"><div class="sum-row"><span>Товары</span><b>${money(subtotal)}</b></div><div class="sum-row"><span>Скидка</span><b>${discount ? '-' + money(discount) : '—'}</b></div><div class="sum-row sum-total"><span>К оплате</span><b>${money(total)}</b></div><button class="btn full" id="placeOrder">Подтвердить заказ</button></div></div></div>`;
}

function orderStatusGroup(order) {
  const status = String(order.statusKey || order.status || '').toLowerCase();
  return status.includes('deliv') || status.includes('достав') || status.includes('получ') ? 'delivered' : 'current';
}

function renderOrderCards(orders) {
  return orders.map((order, index) => {
    const first = productById(order.items?.[0]?.id);
    return `<div class="order-card" style="animation-delay:${index * 50}ms"><div class="order-head"><b>Заказ №${esc(order.id)}</b><span class="status">${esc(order.status || 'Обрабатывается')}</span></div><span class="muted">${esc(dateText(order.createdAt || order.date))}</span><div class="order-body"><div class="order-thumb">${first?.image ? `<img src="${esc(first.image)}" alt="">` : icon('orders', 28)}</div><div><b>${esc(first?.name || 'Питбайк')}</b><div class="muted">${order.items?.reduce((sum, item) => sum + item.qty, 0) || 0} шт. · ${money(order.total)}</div></div></div><div class="order-actions"><span class="muted">${esc(order.delivery || 'Доставка уточняется')}</span><button class="link-btn" data-order="${esc(order.id)}">Подробнее ${icon('chevron', 13)}</button></div></div>`;
  }).join('');
}

function orders() {
  const filter = state.orderFilter || 'all';
  const filtered = state.orders.filter((order) => filter === 'all' || orderStatusGroup(order) === filter);
  const body = filtered.length ? renderOrderCards(filtered) : `<div class="empty"><div class="empty-icon">${icon('orders', 25)}</div><h2>${filter === 'current' ? 'Текущих заказов нет' : filter === 'delivered' ? 'Доставленных заказов нет' : 'Заказов пока нет'}</h2><p class="muted">Здесь будут отображаться заказы, соответствующие выбранному фильтру.</p><button class="btn" data-route="search">Выбрать питбайк</button></div>`;
  const counts = {
    all: state.orders.length,
    current: state.orders.filter((order) => orderStatusGroup(order) === 'current').length,
    delivered: state.orders.filter((order) => orderStatusGroup(order) === 'delivered').length
  };
  screen.innerHTML = `<div class="container orders-page"><div class="page-heading-row"><div><h1 class="page-title">Заказы</h1><p class="muted order-subtitle">История покупок и статус доставки</p></div></div><div class="tabs"><button class="tab ${filter === 'all' ? 'active' : ''}" data-order-filter="all">Все <span>${counts.all}</span></button><button class="tab ${filter === 'current' ? 'active' : ''}" data-order-filter="current">Текущие <span>${counts.current}</span></button><button class="tab ${filter === 'delivered' ? 'active' : ''}" data-order-filter="delivered">Доставлены <span>${counts.delivered}</span></button></div><div class="orders">${body}</div></div>`;
}

function orderDetail(id) {
  const order = state.orders.find((item) => String(item.id) === String(id));
  if (!order) return go('orders');
  const first = productById(order.items?.[0]?.id);
  screen.innerHTML = `<div class="container"><div class="settings-wrap"><h1 class="page-title">Заказ №${esc(order.id)}</h1><div class="notice">${esc(order.status || 'Обрабатывается')} · ${esc(order.delivery || '')}</div><div class="profile-card"><div class="status">${icon('check', 15)} Заказ оформлен</div><p class="muted">${esc(dateText(order.createdAt))}</p>${first ? `<div class="order-body"><div class="order-thumb"><img src="${esc(first.image)}" alt=""></div><div><b>${esc(first.name)}</b><div class="muted">${order.items[0].qty} шт. · ${money(order.total)}</div></div></div>` : ''}</div><button class="btn full" data-route="search">К покупкам</button></div></div>`;
}

function profile() {
  const profileData = state.profile || {};
  const name = profileData.name || state.user?.displayName || state.user?.email?.split('@')[0] || 'Пользователь Truck Bike';
  const email = state.user?.email || profileData.email || 'Email не указан';
  const city = profileData.city || 'Город не выбран';
  const payment = profileData.preferredPayment === 'sbp' ? 'СБП' : profileData.preferredPayment === 'cash' ? 'При получении' : (state.cards[0] ? `${state.cards[0].brand || 'Карта'} •••• ${state.cards[0].last4}` : 'Карта не добавлена');
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'TB';
  const completed = [name, profileData.phone, profileData.city, state.addresses.length, state.cards.length].filter(Boolean).length;
  const progress = Math.round(completed / 5 * 100);
  const quick = [
    ['orders','Мои заказы','Заказы и статусы','orders'],
    ['favorites','Избранное','Сохранённые питбайки','heart'],
    ['addresses','Адреса доставки',city,'pin'],
    ['payments','Способы оплаты',payment,'card'],
    ['personal','Личные данные','Имя, телефон и email','user'],
    ['settings','Настройки','Тема, безопасность и уведомления','settings'],
    ['support','Техподдержка','Получить помощь','support']
  ];
  screen.innerHTML = `<div class="container"><div class="profile-page">
    <div class="profile-banner">
      <div class="profile-cover-glow"></div>
      <div class="profile-main">
        <div class="profile-avatar-xl">${esc(initials)}</div>
        <div class="profile-identity"><span class="profile-kicker">Личный кабинет</span><h1>${esc(name)}</h1><p>${esc(email)}</p><div class="profile-tags"><span>${icon('pin',13)} ${esc(city)}</span><span>${icon('lock',13)} Аккаунт защищён</span></div></div>
        <button class="btn profile-edit-btn" data-route="personal">${icon('user',16)} Редактировать профиль</button>
      </div>
    </div>

    <div class="profile-stats">
      <button class="profile-stat" data-route="orders"><b>${state.orders.length}</b><span>Заказов</span></button>
      <button class="profile-stat" data-route="favorites"><b>${state.favorites.length}</b><span>В избранном</span></button>
      <button class="profile-stat" data-route="addresses"><b>${state.addresses.length}</b><span>Адреса</span></button>
      <button class="profile-stat" data-route="payments"><b>${state.cards.length}</b><span>Карты</span></button>
    </div>

    <div class="profile-grid">
      <section class="profile-panel profile-complete">
        <div class="profile-panel-head"><div><span class="profile-eyebrow">Профиль</span><h2>Заполненность аккаунта</h2></div><strong>${progress}%</strong></div>
        <div class="progress-track"><span style="width:${progress}%"></span></div>
        <p class="muted">Добавь город, адрес и способ оплаты — оформление заказа будет быстрее.</p>
        <div class="profile-checks"><span class="${name ? 'done' : ''}">${icon(name ? 'check':'plus',12)} Имя</span><span class="${profileData.phone ? 'done' : ''}">${icon(profileData.phone ? 'check':'plus',12)} Телефон</span><span class="${profileData.city ? 'done' : ''}">${icon(profileData.city ? 'check':'plus',12)} Город</span><span class="${state.cards.length ? 'done' : ''}">${icon(state.cards.length ? 'check':'plus',12)} Оплата</span></div>
      </section>
      <section class="profile-panel profile-security">
        <div class="profile-panel-head"><div><span class="profile-eyebrow">Безопасность</span><h2>Защита аккаунта</h2></div><span class="security-pill">${getEnrolledTotpFactors().length ? 'TOTP включён' : 'Базовая защита'}</span></div>
        <div class="security-mini"><span class="mini-icon">${icon('lock',17)}</span><div><b>${state.user?.emailVerified ? 'Email подтверждён' : 'Email требует подтверждения'}</b><small>${getEnrolledTotpFactors().length ? 'Вход защищён вторым фактором' : 'Включи 2FA в настройках'}</small></div></div>
        <button class="btn ghost full" data-route="settings">Управление безопасностью</button>
      </section>
    </div>

    <section class="profile-panel profile-links-panel"><div class="profile-panel-head"><div><span class="profile-eyebrow">Аккаунт</span><h2>Быстрые действия</h2></div></div><div class="profile-actions-grid">${quick.map(([route,label,desc,ico]) => `<button class="profile-action" data-route="${route}"><span class="profile-action-icon">${icon(ico,19)}</span><span class="profile-action-copy"><b>${label}</b><small>${esc(desc)}</small></span>${icon('chevron',15)}</button>`).join('')}</div></section>

    <button class="logout-card" id="logout"><span class="logout-icon">${icon('logout',19)}</span><span><b>Выйти из аккаунта</b><small>После выхода потребуется повторный вход</small></span>${icon('chevron',16)}</button>
  </div></div>`;
}

function favorites() {
  const items = state.products.filter((product) => isFavorite(product.id));
  screen.innerHTML = `<div class="container"><h1 class="page-title">Избранное</h1>${items.length ? `<div class="products">${items.map((p, i) => productCard(p, i)).join('')}</div>` : `<div class="empty"><div class="empty-icon">${icon('heart', 25)}</div><h2>Здесь пока пусто</h2><p class="muted">Нажми на сердечко, чтобы сохранить питбайк.</p><button class="btn" data-route="search">Открыть каталог</button></div>`}</div>`;
}

function addresses() {
  screen.innerHTML = `<div class="container"><div class="settings-wrap"><h1 class="page-title">Адреса доставки</h1>${state.addresses.map((address, index) => `<div class="address-card"><b>${esc(address.title || `Адрес ${index + 1}`)}</b><p>${esc(address.address)}</p><span class="muted">${esc(address.note || '')}</span></div>`).join('') || '<div class="empty"><h2>Адресов пока нет</h2><p class="muted">Добавь первый адрес.</p></div>'}<button class="btn" id="addAddress">${icon('plus', 16)}&nbsp; Добавить адрес</button></div></div>`;
}

function payments() {
  screen.innerHTML = `<div class="container"><div class="settings-wrap"><h1 class="page-title">Способы оплаты</h1>${state.cards.map((card, index) => `<div class="payment-card"><div class="menu-left">${icon('card', 18)}<b>${esc(card.brand || 'Карта')} •••• ${esc(card.last4)}</b></div><span class="muted">${index === 0 ? 'Основная карта' : 'Сохранённая карта'}</span><button class="link-btn" data-delete-card="${index}">Удалить</button></div>`).join('') || '<div class="empty"><h2>Карт пока нет</h2><p class="muted">Добавь карту для заказа.</p></div>'}<button class="btn" id="addCard">${icon('plus', 16)}&nbsp; Добавить карту</button></div></div>`;
}

function settings() {
  const prefs = state.profile.settings || {};
  const theme = prefs.theme || (prefs.dark ? 'dark' : 'light');
  const themes = [
    ['light', 'Светлая', 'light'],
    ['graphite', 'Графит', 'graphite'],
    ['forest', 'Лес', 'forest'],
    ['midnight', 'Ночной', 'midnight'],
    ['sand', 'Песок', 'sand'],
    ['ice', 'Лёд', 'ice']
  ];
  const totpFactors = getEnrolledTotpFactors();
  const selectedCity = state.profile.city || '';
  const selectedPayment = state.profile.preferredPayment || 'card';
  screen.innerHTML = `<div class="container"><div class="settings-wrap"><h1 class="page-title">Настройки</h1>
    <section class="settings-section"><div class="section-title"><h2>Тема оформления</h2><span class="muted">${esc(themes.find((item) => item[0] === theme)?.[1] || 'Светлая')}</span></div><div class="theme-grid">${themes.map(([key, label]) => `<button class="theme-card ${theme === key ? 'active' : ''}" data-theme="${key}"><span class="theme-preview ${key}"></span><b>${label}</b>${theme === key ? `<span class="theme-check">${icon('check', 14)}</span>` : ''}</button>`).join('')}</div></section>
    <section class="settings-section"><div class="section-title"><h2>Регион и оплата</h2><span class="muted">Сохраняется в профиле</span></div><div class="pref-grid"><label>Город<select id="citySelect"><option value="">Выбери город</option>${['Москва','Санкт-Петербург','Казань','Екатеринбург','Новосибирск','Краснодар','Ростов-на-Дону','Самара','Уфа','Другой'].map((city) => `<option value="${city}" ${city === selectedCity ? 'selected' : ''}>${city}</option>`).join('')}</select></label><label>Основной способ оплаты<select id="paymentSelect"><option value="card" ${selectedPayment === 'card' ? 'selected' : ''}>Банковская карта</option><option value="sbp" ${selectedPayment === 'sbp' ? 'selected' : ''}>СБП</option><option value="cash" ${selectedPayment === 'cash' ? 'selected' : ''}>При получении</option></select></label></div><button class="btn small" id="savePrefs">Сохранить настройки</button></section>
    <section class="settings-section"><div class="section-title"><h2>Уведомления</h2></div>
      ${[['push','Уведомления','Получать статусы заказов',prefs.push !== false],['promo','Акции и предложения','Спецпредложения Truck Bike',prefs.promo !== false]].map(([key,title,text,active]) => `<div class="setting"><div><b>${title}</b><div class="muted" style="font-size:11px;margin-top:3px">${text}</div></div><button class="switch ${active ? 'on' : ''}" data-toggle="${key}" aria-label="Переключить"></button></div>`).join('')}
    </section>
    <section class="settings-section"><div class="section-title"><h2>Защита аккаунта</h2><span class="muted">TOTP · приложение-аутентификатор</span></div><div class="security-row"><div><b>Двухфакторная аутентификация</b><p class="muted">${totpFactors.length ? 'TOTP включён. Для входа нужен код из Google Authenticator, Authy или другого совместимого приложения.' : 'Добавь TOTP, чтобы защитить аккаунт вторым фактором.'}</p></div><button class="btn ${totpFactors.length ? 'ghost' : ''}" id="totpAction">${totpFactors.length ? 'Отключить TOTP' : 'Включить TOTP'}</button></div><div class="verification-row"><div><b>Email</b><p class="muted">${state.user?.emailVerified ? 'Email подтверждён' : 'Email ещё не подтверждён'}</p></div>${state.user?.emailVerified ? '<span class="verified">Подтверждён</span>' : '<button class="link-btn" id="resendVerification">Отправить письмо ещё раз</button>'}</div></section>
  </div></div>`;
}

function support() {
  const tickets = state.supportTickets || [];
  const ticketsHtml = tickets.length ? `<div class="ticket-list">${tickets.map((ticket) => `<article class="ticket-card"><div class="ticket-head"><b>${esc(ticket.subject || 'Вопрос')}</b><span class="ticket-status ${ticket.status === 'answered' ? 'answered' : ''}">${ticket.status === 'answered' ? 'Есть ответ' : 'Ожидает ответа'}</span></div><p>${esc(ticket.message || '')}</p>${ticket.reply ? `<div class="ticket-answer"><b>Поддержка</b><p>${esc(ticket.reply)}</p></div>` : ''}<span class="muted">${esc(dateText(ticket.createdAt))}</span></article>`).join('')}</div>` : `<div class="empty"><div class="empty-icon">${icon('support', 25)}</div><h2>Обращений пока нет</h2><p class="muted">Напиши нам — ответ появится здесь.</p></div>`;
  screen.innerHTML = `<div class="container"><div class="settings-wrap"><h1 class="page-title">Техподдержка</h1><div class="profile-card support-intro"><h3>Поддержка Truck Bike</h3><p class="muted">Поможем с выбором питбайка, заказом, оплатой, доставкой и гарантией.</p><button class="btn" id="newTicket">Создать обращение</button></div>${ticketsHtml}</div></div>`;
}

function notifications() {
  screen.innerHTML = `<div class="container"><div class="settings-wrap"><h1 class="page-title">Уведомления</h1><div class="profile-card"><div class="menu-left">${icon('bell',18)} <b>Truck Bike</b></div><p class="muted">${state.orders[0] ? `Заказ №${esc(state.orders[0].id)} принят в работу.` : 'Пока нет новых уведомлений.'}</p></div></div></div>`;
}

function personal() {
  const profile = state.profile || {};
  screen.innerHTML = `<div class="container"><div class="settings-wrap"><h1 class="page-title">Личные данные</h1><div class="profile-card"><div class="form"><div><label>Имя и фамилия</label><input id="pName" value="${esc(profile.name || state.user?.displayName || '')}"></div><div><label>Телефон</label><input id="pPhone" value="${esc(profile.phone || '')}"></div><div><label>Email</label><input id="pEmail" value="${esc(state.user?.email || profile.email || '')}" disabled></div><button class="btn full" id="savePersonal">Сохранить изменения</button></div></div></div></div>`;
}

function authScreen(mode = 'login') {
  const isLogin = mode === 'login';
  screen.innerHTML = `<div class="auth-page"><div class="auth-card"><div class="auth-logo">TRUCK <b>BIKE</b></div><div class="auth-kicker">Магазин питбайков</div><h1>${isLogin ? 'Вход в аккаунт' : 'Создать аккаунт'}</h1><p class="muted">${isLogin ? 'Сохрани корзину, избранное и заказы в своём профиле.' : 'Один аккаунт для корзины, заказов и избранного.'}</p><form id="authForm" class="form">${!isLogin ? '<div><label>Имя</label><input id="authName" required placeholder="Иван Петров"></div>' : ''}<div><label>Email</label><input id="authEmail" type="email" required autocomplete="email" placeholder="you@example.com"></div><div><label>Пароль</label><input id="authPassword" type="password" required minlength="6" autocomplete="current-password" placeholder="Минимум 6 символов"></div><button class="btn full" type="submit">${isLogin ? 'Войти' : 'Зарегистрироваться'}</button></form><div class="auth-links"><button class="link-btn" id="switchAuth">${isLogin ? 'Создать аккаунт' : 'Уже есть аккаунт'}</button>${isLogin ? '<button class="link-btn" id="forgotPassword">Забыли пароль?</button>' : ''}</div><div class="auth-note">Данные аккаунта хранятся в Firebase.</div></div></div>`;
  document.querySelector('#authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#authEmail').value.trim();
    const password = document.querySelector('#authPassword').value;
    try {
      if (isLogin) {
        try {
          await signIn(email, password);
        } catch (error) {
          if (error.mfaResolver) {
            const code = window.prompt('Введи шестизначный код TOTP из приложения-аутентификатора:');
            if (!code) return;
            await resolveTotpSignIn(error.mfaResolver, code);
          } else { throw error; }
        }
      } else await signUp(email, password, document.querySelector('#authName').value.trim());
    } catch (error) {
      toastMsg(authError(error));
    }
  });
  document.querySelector('#switchAuth').onclick = () => authScreen(isLogin ? 'signup' : 'login');
  document.querySelector('#forgotPassword')?.addEventListener('click', async () => {
    const email = document.querySelector('#authEmail').value.trim();
    if (!email) return toastMsg('Сначала укажи email');
    try { await resetPassword(email); toastMsg('Письмо для сброса пароля отправлено'); }
    catch (error) { toastMsg(authError(error)); }
  });
}

function authError(error) {
  const code = error?.code || '';
  const messages = {
    'auth/invalid-credential': 'Неверный email или пароль',
    'auth/invalid-email': 'Некорректный email',
    'auth/email-already-in-use': 'Этот email уже зарегистрирован',
    'auth/weak-password': 'Пароль слишком простой',
    'auth/network-request-failed': 'Ошибка сети',
    'auth/too-many-requests': 'Слишком много попыток. Попробуй позже.'
  };
  return messages[code] || error?.message || 'Ошибка авторизации';
}

async function savePersonal() {
  const profile = {
    ...state.profile,
    name: document.querySelector('#pName')?.value.trim() || '',
    phone: document.querySelector('#pPhone')?.value.trim() || '',
    email: state.user?.email || ''
  };
  try { state.profile = profile; if (profile.name) await updateAuthDisplayName(profile.name); await saveUserState(state.user.uid, { profile }); syncProfileChrome(); render(); toastMsg('Данные сохранены'); }
  catch (error) { console.error(error); toastMsg('Не удалось сохранить данные'); }
}

function showModal(title, body, onConfirm) {
  modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="modal-close" data-modal-close>${icon('close', 17)}</button></div><div class="modal-copy">${body}</div><div class="form-actions"><button class="btn ghost" data-modal-close>Отмена</button><button class="btn" id="modalConfirm">Готово</button></div></div></div>`;
  modalRoot.querySelectorAll('[data-modal-close]').forEach((button) => button.onclick = () => { modalRoot.innerHTML = ''; });
  modalRoot.querySelector('#modalConfirm').onclick = onConfirm;
}

function addressModal() {
  showModal('Новый адрес', '<div class="form"><label>Название</label><input id="addressTitle" placeholder="Дом"><label>Адрес</label><input id="addressValue" placeholder="Город, улица, дом"><label>Комментарий</label><input id="addressNote" placeholder="Домофон, подъезд"></div>', async () => {
    const address = {
      title: document.querySelector('#addressTitle').value.trim() || 'Адрес',
      address: document.querySelector('#addressValue').value.trim(),
      note: document.querySelector('#addressNote').value.trim()
    };
    if (!address.address) return toastMsg('Укажи адрес');
    state.addresses = [...state.addresses, address];
    await persist(); modalRoot.innerHTML = ''; render(); toastMsg('Адрес сохранён');
  });
}

function cardModal() {
  showModal('Добавить карту', '<div class="form"><label>Бренд</label><input id="cardBrand" placeholder="Visa"><label>Номер карты</label><input id="cardNumber" inputmode="numeric" placeholder="4242 4242 4242 4242"><label>Срок</label><input id="cardExpiry" placeholder="12/28"></div>', async () => {
    const digits = document.querySelector('#cardNumber').value.replace(/\D/g, '');
    if (digits.length < 4) return toastMsg('Укажи номер карты');
    state.cards = [...state.cards, { brand: document.querySelector('#cardBrand').value.trim() || 'Карта', last4: digits.slice(-4), expiry: document.querySelector('#cardExpiry').value.trim() }];
    await persist(); modalRoot.innerHTML = ''; render(); toastMsg('Карта сохранена');
  });
}

async function toggleFavorite(id) {
  const wasLiked = isFavorite(id);
  state.favorites = wasLiked
    ? state.favorites.filter((favorite) => String(favorite) !== String(id))
    : [...state.favorites, String(id)];
  await persist();
  render();
  toastMsg(wasLiked ? 'Удалено из избранного' : 'Добавлено в избранное');
}

async function addCart(id, qty = 1) {
  const row = cartItem(id);
  if (row) row.qty += qty;
  else state.cart.push({ id: String(id), qty });
  await persist();
  updateBadges();
  syncCartButtons(id);
  const item = cartItem(id);
  toastMsg(item ? `Питбайк в корзине · ${item.qty} шт.` : 'Питбайк добавлен в корзину');
}

async function changeQty(id, delta) {
  const row = state.cart.find((item) => String(item.id) === String(id));
  if (!row) return;
  row.qty += delta;
  if (row.qty < 1) state.cart = state.cart.filter((item) => String(item.id) !== String(id));
  await persist(); render();
}

async function removeFromCart(id) {
  state.cart = state.cart.filter((item) => String(item.id) !== String(id));
  await persist(); render(); toastMsg('Товар удалён');
}

async function deleteCard(index) {
  state.cards = state.cards.filter((_, itemIndex) => itemIndex !== index);
  await persist(); render(); toastMsg('Карта удалена');
}

async function toggleSetting(key) {
  state.profile.settings = { ...(state.profile.settings || {}), [key]: !(state.profile.settings?.[key] ?? false) };
  await persist(); render(); toastMsg('Настройка сохранена');
}

async function applyTheme(theme) {
  state.profile.settings = { ...(state.profile.settings || {}), theme, dark: theme === 'dark' || theme === 'midnight' };
  applyThemeClass(theme);
  await persist(); render(); toastMsg('Тема изменена');
}

function applyThemeClass(theme) {
  document.body.classList.remove('theme-light','theme-graphite','theme-forest','theme-midnight','theme-sand','theme-ice','darkmode');
  document.body.classList.add(`theme-${theme || 'light'}`);
}

async function savePreferences() {
  const city = document.querySelector('#citySelect')?.value || '';
  const preferredPayment = document.querySelector('#paymentSelect')?.value || 'card';
  state.profile = { ...state.profile, city, preferredPayment };
  await persist(); render(); toastMsg('Город и способ оплаты сохранены');
}

async function startTotpSetup() {
  const password = window.prompt('Для включения TOTP повторно введи пароль аккаунта:');
  if (!password) return;
  try {
    const result = await beginTotpEnrollment(password);
    state.pendingTotpSecret = result.secret;
    const qr = result.uri;
    showModal('Настройка TOTP', `<div class="totp-setup"><p>1. Открой Google Authenticator, Authy или другое TOTP-приложение.</p><div id="totpQr" class="totp-qr"></div><p>2. Отсканируй QR-код или введи ключ вручную:</p><code class="totp-secret">${esc(result.secretKey)}</code><p>3. Введи шестизначный код из приложения.</p><input id="totpCode" inputmode="numeric" maxlength="6" placeholder="000000"></div>`, async () => {
      const code = document.querySelector('#totpCode')?.value || '';
      if (!/^\d{6}$/.test(code)) return toastMsg('Нужен шестизначный код');
      try {
        await finishTotpEnrollment(state.pendingTotpSecret, code, 'Truck Bike');
        state.profile.settings = { ...(state.profile.settings || {}), totpEnabled: true };
        await persist();
        state.pendingTotpSecret = null;
        modalRoot.innerHTML = '';
        render();
        toastMsg('TOTP включён');
      } catch (error) { toastMsg(error.message || 'Не удалось включить TOTP'); }
    });
    if (window.QRCode && document.querySelector('#totpQr')) new window.QRCode(document.querySelector('#totpQr'), { text: qr, width: 170, height: 170 });
  } catch (error) { toastMsg(error.message || 'Не удалось начать настройку TOTP'); }
}

async function stopTotpSetup() {
  const factors = getEnrolledTotpFactors();
  if (!factors.length) return toastMsg('TOTP уже отключён');
  const password = window.prompt('Для отключения TOTP повторно введи пароль аккаунта:');
  if (!password) return;
  try { await disableTotpEnrollment(factors[0].uid, password); state.profile.settings = { ...(state.profile.settings || {}), totpEnabled: false }; await persist(); render(); toastMsg('TOTP отключён'); }
  catch (error) { toastMsg(error.message || 'Не удалось отключить TOTP'); }
}

function supportModal() {
  showModal('Новое обращение', `<div class="form"><label>Тема</label><select id="ticketSubject"><option>Выбор питбайка</option><option>Заказ</option><option>Оплата</option><option>Доставка</option><option>Гарантия</option><option>Другое</option></select><label>Вопрос</label><textarea id="ticketMessage" rows="5" placeholder="Опиши проблему или вопрос"></textarea></div>`, async () => {
    const subject = document.querySelector('#ticketSubject')?.value || 'Другое';
    const message = document.querySelector('#ticketMessage')?.value.trim() || '';
    if (!message) return toastMsg('Опиши вопрос');
    try {
      const ticket = await createSupportTicket(state.user.uid, { subject, message });
      state.supportTickets.unshift(ticket);
      modalRoot.innerHTML = ''; render(); toastMsg('Обращение отправлено');
    } catch (error) { console.error(error); toastMsg('Не удалось отправить обращение'); }
  });
}

async function placeOrder() {
  if (!state.cart.length) return toastMsg('Корзина пуста');
  if (!state.addresses.length) return go('addresses');
  if (!state.cards.length) return go('payments');
  const subtotal = cartTotal();
  const discount = state.promo === 'TRUCK10' ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;
  const items = state.cart.map((item) => ({ id: item.id, qty: item.qty }));
  try {
    const order = await createOrder(state.user.uid, { items, total, status: 'Доставляется', statusKey: 'delivery', delivery: 'завтра, 16:00–18:00' });
    state.orders.unshift(order);
    state.cart = [];
    state.promo = '';
    await persist();
    go('orders'); toastMsg('Заказ оформлен');
  } catch (error) { console.error(error); toastMsg('Не удалось оформить заказ'); }
}

async function quickBuy(id) {
  await addCart(id, 1);
  go('cart');
}

function render() {
  setNav(); updateBadges();
  if (state.route === 'home') home();
  else if (state.route === 'search') search();
  else if (state.route === 'categories') categoriesPage();
  else if (state.route === 'product') productPage(state.payload);
  else if (state.route === 'cart') cartPage();
  else if (state.route === 'checkout') checkout();
  else if (state.route === 'orders') orders();
  else if (state.route === 'orderDetail') orderDetail(state.payload);
  else if (state.route === 'profile') profile();
  else if (state.route === 'favorites') favorites();
  else if (state.route === 'addresses') addresses();
  else if (state.route === 'payments') payments();
  else if (state.route === 'settings') settings();
  else if (state.route === 'support') support();
  else if (state.route === 'notifications') notifications();
  else if (state.route === 'personal') personal();
}

async function loadUser(user) {
  await ensureUserDocument(user);
  const data = await loadUserState(user.uid);
  state.user = user;
  state.profile = data.profile || {};
  state.favorites = Array.isArray(data.favorites) ? data.favorites : [];
  state.cart = Array.isArray(data.cart) ? data.cart : [];
  state.addresses = Array.isArray(data.addresses) ? data.addresses : [];
  state.cards = Array.isArray(data.cards) ? data.cards : [];
  state.orders = await loadOrders(user.uid);
  try { state.supportTickets = await loadSupportTickets(user.uid); } catch (_) { state.supportTickets = []; }
  applyThemeClass(state.profile?.settings?.theme || (state.profile?.settings?.dark ? 'dark' : 'light'));
  syncProfileChrome();
}

async function init() {
  setupChrome();
  watchAuth(async (user) => {
    state.booting = false;
    if (!user) {
      authScreen('login');
      return;
    }
    try {
      await loadUser(user);
      if (!state.products.length) {
        state.products = await loadProducts();
        try { state.categories = await loadCategories(); } catch (_) { state.categories = []; }
      }
      if (!state.products.length) {
        screen.innerHTML = `<div class="container"><div class="empty"><h2>Каталог пуст</h2><p class="muted">Загрузите документы в коллекцию products в Firestore.</p></div></div>`;
        return;
      }
      render();
    } catch (error) {
      console.error(error);
      screen.innerHTML = `<div class="container"><div class="empty firebase-error"><div class="empty-icon">${icon('settings',25)}</div><h2>Не удалось загрузить Truck Bike</h2><p class="muted">Проверь Firestore Rules и наличие коллекции products.</p><code>${esc(error.message || error)}</code><button class="btn" id="reloadPage">Повторить</button></div></div>`;
      document.querySelector('#reloadPage')?.addEventListener('click', () => window.location.reload());
    }
  });
}

document.addEventListener('click', async (event) => {
  const routeNode = event.target.closest('[data-route]');
  if (routeNode) { go(routeNode.dataset.route); return; }

  const categoryNode = event.target.closest('[data-category]');
  if (categoryNode) { state.category = categoryNode.dataset.category; go('search'); return; }

  const productNode = event.target.closest('[data-open-product]');
  if (productNode && !event.target.closest('button')) { go('product', productNode.dataset.openProduct); return; }

  const favNode = event.target.closest('[data-fav]');
  if (favNode) { event.preventDefault(); event.stopPropagation(); await toggleFavorite(favNode.dataset.fav); return; }

  const addNode = event.target.closest('[data-add]');
  if (addNode) { await addCart(addNode.dataset.add); return; }

  const qtyNode = event.target.closest('[data-qty]');
  if (qtyNode) { await changeQty(qtyNode.dataset.qty, Number(qtyNode.dataset.d)); return; }

  const removeNode = event.target.closest('[data-remove]');
  if (removeNode) { await removeFromCart(removeNode.dataset.remove); return; }

  const orderNode = event.target.closest('[data-order]');
  if (orderNode) { go('orderDetail', orderNode.dataset.order); return; }

  const orderFilterNode = event.target.closest('[data-order-filter]');
  if (orderFilterNode) { state.orderFilter = orderFilterNode.dataset.orderFilter; render(); return; }

  const sizeNode = event.target.closest('[data-size]');
  if (sizeNode) { state.selectedSize = sizeNode.dataset.size; render(); return; }

  if (event.target.id === 'backBtn') { go(state.previousRoute || 'home'); return; }
  if (event.target.id === 'notifyBtn') { go('notifications'); return; }
  if (event.target.id === 'clearSearch') { state.query = ''; updateResults(); return; }
  if (event.target.id === 'resetFilters') { state.query = ''; state.category = 'Все'; state.sort = 'popular'; render(); return; }
  if (event.target.id === 'promoBtn') { state.promo = document.querySelector('#promoInput').value.trim().toUpperCase(); render(); toastMsg(state.promo === 'TRUCK10' ? 'Промокод применён' : 'Промокод не найден'); return; }
  if (event.target.id === 'placeOrder') { await placeOrder(); return; }
  if (event.target.id === 'addAddress') { addressModal(); return; }
  if (event.target.id === 'addCard') { cardModal(); return; }
  if (event.target.id === 'savePersonal') { await savePersonal(); return; }
  if (event.target.id === 'logout') { showModal('Выйти из аккаунта?', '<p class=\"muted\">Корзина и данные сохранены в Firebase. После выхода ты сможешь войти снова в любое время.</p>', async () => { try { await signOutCurrentUser(); modalRoot.innerHTML = ''; } catch (error) { toastMsg(error.message || 'Не удалось выйти'); } }); return; }
  if (event.target.id === 'quickBuy') { await quickBuy(event.target.dataset.product); return; }
  if (event.target.id === 'chatSupport') { toastMsg('Чат поддержки подключим через отдельный backend'); return; }
  if (event.target.id === 'callSupport') { window.location.href = 'tel:+78005550000'; return; }
  if (event.target.id === 'faqSupport') { toastMsg('Частые вопросы: доставка, оплата, гарантия и подбор'); return; }
  if (event.target.id === 'newTicket') { supportModal(); return; }
  if (event.target.id === 'savePrefs') { await savePreferences(); return; }
  if (event.target.id === 'resendVerification') { try { await resendVerification(); toastMsg('Письмо отправлено'); } catch (error) { toastMsg(error.message || 'Не удалось отправить письмо'); } return; }
  if (event.target.id === 'totpAction') { if (getEnrolledTotpFactors().length) await stopTotpSetup(); else await startTotpSetup(); return; }

  const deleteCardNode = event.target.closest('[data-delete-card]');
  if (deleteCardNode) { await deleteCard(Number(deleteCardNode.dataset.deleteCard)); return; }

  const themeNode = event.target.closest('[data-theme]');
  if (themeNode) { await applyTheme(themeNode.dataset.theme); return; }

  const toggle = event.target.closest('[data-toggle]');
  if (toggle) { await toggleSetting(toggle.dataset.toggle); return; }

  if (event.target.closest('[data-modal-close]')) modalRoot.innerHTML = '';
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'searchInput') { state.query = event.target.value; updateResults(); }
});
document.addEventListener('change', (event) => {
  if (event.target.id === 'sort') { state.sort = event.target.value; updateResults(); }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') modalRoot.innerHTML = '';
});

document.querySelector('#desktopSearchIcon').innerHTML = icon('search', 18);
init();
