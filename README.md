# TRUCK BIKE — Firebase production-ready frontend

Версия без демо-режима: каталог, корзина, избранное, адреса, карты и заказы работают через Firebase.

## Авторизация
Используется Firebase Authentication по Email/Password.
В Firebase Console открой:
Authentication → Sign-in method → Email/Password → Enable.

## Firestore
Нужные коллекции:
- `products` — каталог питбайков
- `categories` — категории
- `users/{uid}` — профиль, корзина, избранное, адреса, карты
- `users/{uid}/orders` — заказы пользователя

Firestore не требует отдельного создания пустой коллекции: она появляется при первой записи документа. После регистрации приложение автоматически создаёт `users/{uid}`. После оформления заказа создаётся `users/{uid}/orders/{orderId}`.

Для первоначального каталога я добавил админский seed-скрипт `scripts/seed-firestore.mjs`. Он создаёт/обновляет `categories` и `products`. Запуск:

```bash
npm install
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npm run seed
```

Сервисный ключ Firebase не нужно помещать в сайт или коммитить в репозиторий.

## Ошибка `Unexpected token ')'`
В предыдущем `app.js` были лишние закрывающие `});` в обработчиках количества и избранного. В этой версии `app.js` переписан без этой ошибки и проверен парсером Node.

## Запуск
Открывай через локальный сервер, а не через `file://`:
`python3 -m http.server 8080`
и затем `http://localhost:8080/`.


## Обновления v8.1

- 6 тем оформления: Светлая, Графит, Лес, Ночной, Песок, Лёд.
- Город пользователя и основной способ оплаты сохраняются в Firestore.
- TOTP 2FA через Firebase Multi-Factor Authentication: включение через QR/секрет, проверка кода и отключение. Для TOTP Firebase требует Firebase Authentication with Identity Platform и подтверждённый email.
- Реальная техподдержка: пользователь создаёт обращения в `supportTickets`, видит ответы администратора.
- Имя в шапке и профиле больше не захардкожено: берётся из Firestore profile.name, а при изменении личных данных обновляется и Firebase Auth displayName.
