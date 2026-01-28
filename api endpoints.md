# API Endpoints - Система формирования команд для марафона

## Аутентификация

- POST `/api/auth/request-code`
  - Тело запроса `{ "email": "you@example.com" }`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 422 - ошибки валидации тела
    - 429 - превышен лимит (общее 2/мин, 10/час или чаще 1/мин на один адрес)
    - 500 - внутренняя ошибка сервера

- POST `/api/auth/verify-code`
  - Тело запроса `{ "email": "you@example.com", "code": "123456" }`
  - Ответ 200 `{ "status": "ok", "user": { "id": "...", "email": "..." } }`
  - Ошибки
    - 401 - неверный код
    - 410 - код истёк
    - 422 - ошибки валидации тела
    - 500 - внутренняя ошибка сервера

- POST `/api/auth/logout`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 500 - внутренняя ошибка сервера

- GET `/api/auth/me`
  - Ответ 200 `{ "id": "...", "email": "..." }`
  - Ошибки
    - 401 - не авторизован
    - 500 - внутренняя ошибка сервера

---

## Марафоны

- POST `/api/marathons`
  - Тело запроса `{ "name": "Game Jam 2026", "slug": "gamejam2026", "minTeamSize": 2, "maxTeamSize": 5 }`
  - Ответ 201 `{ "id": "...", "name": "...", "slug": "...", "minTeamSize": 2, "maxTeamSize": 5 }`
  - Ошибки
    - 401 - не авторизован
    - 409 - slug уже занят
    - 422 - ошибки валидации тела
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons`
  - Ответ 200 `{ "marathons": [{ "id": "...", "name": "...", "slug": "..." }, ...] }`
  - Ошибки
    - 401 - не авторизован
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons/:slug`
  - Ответ 200 `{ "id": "...", "name": "...", "slug": "...", "minTeamSize": 2, "maxTeamSize": 5 }`
  - Ошибки
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

- PATCH `/api/marathons/:slug`
  - Тело запроса `{ "name": "...", "minTeamSize": 2, "maxTeamSize": 6 }`
  - Ответ 200 `{ "id": "...", "name": "...", "slug": "...", ... }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор)
    - 404 - марафон не найден
    - 422 - ошибки валидации тела
    - 500 - внутренняя ошибка сервера

- DELETE `/api/marathons/:slug`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор)
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

---

## Участие в марафоне

- POST `/api/marathons/:slug/join`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - забанен в марафоне
    - 404 - марафон не найден
    - 409 - уже участник
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/leave`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 404 - марафон не найден
    - 409 - не является участником
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons/:slug/my-status`
  - Ответ 200 `{ "isParticipant": true, "isOrganizer": false, "isBanned": false, "isSuspended": false, "suspendReason": null }`
  - Ошибки
    - 401 - не авторизован
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

---

## Организаторы марафона

- GET `/api/marathons/:slug/organizers`
  - Ответ 200 `{ "organizers": [{ "id": "...", "email": "..." }, ...] }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/organizers`
  - Тело запроса `{ "userId": "..." }`
  - Ответ 201 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор)
    - 404 - марафон или пользователь не найден
    - 409 - уже организатор
    - 500 - внутренняя ошибка сервера

- DELETE `/api/marathons/:slug/organizers/:userId`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор) или попытка удалить создателя
    - 404 - марафон или организатор не найден
    - 500 - внутренняя ошибка сервера

---

## Модерация (только организатор)

- POST `/api/marathons/:slug/participants/:id/ban`
  - Тело запроса `{ "reason": "..." }`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор)
    - 404 - участник не найден
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/participants/:id/suspend`
  - Тело запроса `{ "reason": "Нарушение правил" }`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор)
    - 404 - участник не найден
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/participants/:id/unsuspend`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор)
    - 404 - участник не найден или не отстранён
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/teams/:teamId/suspend`
  - Тело запроса `{ "reason": "Нарушение правил" }`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор)
    - 404 - команда не найдена
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/teams/:teamId/unsuspend`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор)
    - 404 - команда не найдена или не отстранена
    - 500 - внутренняя ошибка сервера

- DELETE `/api/marathons/:slug/teams/:teamId`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - нет прав (не организатор)
    - 404 - команда не найдена
    - 500 - внутренняя ошибка сервера

---

## Профиль участника

- GET `/api/marathons/:slug/my-profile`
  - Ответ 200 `{ "id": "...", "name": "...", "nickname": "...", "roles": [...], "technologies": [...], "description": "..." }`
  - Ответ 204 - профиль не заполнен
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

- PATCH `/api/marathons/:slug/my-profile`
  - Тело запроса `{ "name": "Иван Иванов", "nickname": "ivan123", "roles": ["programmer"], "technologies": ["unity", "csharp"], "description": "..." }`
  - Ответ 200 `{ "id": "...", "name": "...", ... }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон не найден
    - 409 - nickname уже занят
    - 422 - ошибки валидации тела
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/my-profile/copy-from/:sourceSlug`
  - Ответ 200 `{ "id": "...", "name": "...", ... }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник одного из марафонов
    - 404 - марафон не найден или профиль в источнике не заполнен
    - 409 - nickname уже занят в целевом марафоне
    - 500 - внутренняя ошибка сервера

---

## Участники марафона (поиск)

- GET `/api/marathons/:slug/participants`
  - Query параметры: `?available=true&roles=programmer,designer&technologies=unity`
  - Ответ 200 `{ "participants": [{ "id": "...", "name": "...", "nickname": "...", "roles": [...], "technologies": [...], "hasTeam": false }, ...] }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons/:slug/participants/:id`
  - Ответ 200 `{ "id": "...", "name": "...", "nickname": "...", "roles": [...], "technologies": [...], "description": "...", "hasTeam": false, "teamId": null }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон или участник не найден
    - 500 - внутренняя ошибка сервера

---

## Команды

- POST `/api/marathons/:slug/teams`
  - Тело запроса `{ "name": "Dream Team", "managementType": "scrum", "decisionSystem": "dictatorship", "genre": "rpg", "description": "...", "chatLink": "...", "gitLink": "..." }`
  - Ответ 201 `{ "id": "...", "name": "...", "leaderId": "...", ... }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона или уже в команде
    - 404 - марафон не найден
    - 422 - ошибки валидации тела
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons/:slug/teams`
  - Query параметры: `?managementType=scrum&decisionSystem=democracy&genre=rpg&hasOpenPositions=true&openPositionRole=programmer`
  - Ответ 200 `{ "teams": [{ "id": "...", "name": "...", "managementType": "...", "decisionSystem": "...", "memberCount": 3, "openPositions": [...] }, ...] }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons/:slug/teams/:teamId`
  - Ответ 200 `{ "id": "...", "name": "...", "managementType": "...", "decisionSystem": "...", "leaderId": "...", "members": [...], "openPositions": [...], "genre": "...", "description": "...", ... }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон или команда не найдена
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons/:slug/my-team`
  - Ответ 200 `{ "id": "...", "name": "...", ... }`
  - Ответ 204 - не состоит в команде
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/my-team/leave`
  - Ответ 200 `{ "status": "ok", "teamBecameDemocracy": true }` (teamBecameDemocracy=true если был тимлидом)
  - Ошибки
    - 401 - не авторизован
    - 404 - марафон не найден или не состоит в команде
    - 500 - внутренняя ошибка сервера

---

## Открытые позиции команды

- GET `/api/marathons/:slug/teams/:teamId/positions`
  - Ответ 200 `{ "positions": [{ "id": "...", "role": "programmer", "description": "..." }, ...] }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон или команда не найдена
    - 500 - внутренняя ошибка сервера

---

## Запросы на изменения в команде

- GET `/api/marathons/:slug/my-team/requests`
  - Query параметры: `?status=pending` (pending, approved, rejected)
  - Ответ 200 `{ "requests": [{ "id": "...", "type": "invite", "status": "pending", "authorId": "...", "votes": { "approve": 2, "reject": 1 }, "data": {...}, "createdAt": "..." }, ...] }`
  - Ошибки
    - 401 - не авторизован
    - 404 - марафон не найден или не состоит в команде
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/my-team/requests`
  - Тело запроса (варианты):
    - `{ "type": "invite", "participantId": "...", "message": "..." }`
    - `{ "type": "open_position", "role": "programmer", "description": "..." }`
    - `{ "type": "close_position", "positionId": "..." }`
    - `{ "type": "kick", "memberId": "..." }`
    - `{ "type": "update_settings", "changes": { "name": "...", "managementType": "..." } }`
    - `{ "type": "accept_application", "applicationId": "..." }`
    - `{ "type": "reject_application", "applicationId": "..." }`
    - `{ "type": "transfer_lead", "memberId": "..." }`
    - `{ "type": "change_decision_system", "decisionSystem": "democracy" }`
    - `{ "type": "change_decision_system", "decisionSystem": "dictatorship", "leaderId": "..." }`
  - Ответ 201 `{ "id": "...", "type": "...", "status": "pending", ... }`
  - Ошибки
    - 401 - не авторизован
    - 404 - марафон не найден или не состоит в команде
    - 409 - аналогичный запрос уже существует
    - 422 - ошибки валидации тела
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons/:slug/my-team/requests/:requestId`
  - Ответ 200 `{ "id": "...", "type": "...", "status": "...", "authorId": "...", "votes": [...], "data": {...}, "createdAt": "...", "resolvedAt": "..." }`
  - Ошибки
    - 401 - не авторизован
    - 404 - марафон, команда или запрос не найден
    - 500 - внутренняя ошибка сервера

- DELETE `/api/marathons/:slug/my-team/requests/:requestId`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не автор запроса
    - 404 - марафон, команда или запрос не найден
    - 409 - запрос уже обработан
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/my-team/requests/:requestId/vote`
  - Тело запроса `{ "vote": "approve" }` или `{ "vote": "reject" }`
  - Ответ 200 `{ "status": "ok", "requestStatus": "pending", "votes": { "approve": 3, "reject": 1 } }`
  - Ответ 200 `{ "status": "ok", "requestStatus": "approved" }` (если набралось большинство)
  - Ошибки
    - 401 - не авторизован
    - 403 - команда в режиме диктатуры (голосование недоступно)
    - 404 - марафон, команда или запрос не найден
    - 409 - уже голосовал или запрос уже обработан
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/my-team/requests/:requestId/decide`
  - Тело запроса `{ "decision": "approve" }` или `{ "decision": "reject" }`
  - Ответ 200 `{ "status": "ok", "requestStatus": "approved" }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не тимлид или команда в режиме демократии
    - 404 - марафон, команда или запрос не найден
    - 409 - запрос уже обработан
    - 500 - внутренняя ошибка сервера

---

## Заявки (участник -> команда)

- POST `/api/marathons/:slug/teams/:teamId/applications`
  - Тело запроса `{ "message": "Хочу присоединиться к вашей команде..." }`
  - Ответ 201 `{ "id": "...", "teamId": "...", "status": "pending", "message": "...", "createdAt": "..." }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона или уже в команде
    - 404 - марафон или команда не найдена
    - 409 - заявка уже подана
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons/:slug/my-applications`
  - Ответ 200 `{ "applications": [{ "id": "...", "teamId": "...", "teamName": "...", "status": "pending", "message": "...", "createdAt": "..." }, ...] }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

- DELETE `/api/marathons/:slug/my-applications/:applicationId`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 404 - марафон или заявка не найдена
    - 409 - заявка уже обработана
    - 500 - внутренняя ошибка сервера

- GET `/api/marathons/:slug/my-team/applications`
  - Ответ 200 `{ "applications": [{ "id": "...", "participantId": "...", "participantName": "...", "status": "pending", "message": "...", "createdAt": "..." }, ...] }`
  - Ошибки
    - 401 - не авторизован
    - 404 - марафон не найден или не состоит в команде
    - 500 - внутренняя ошибка сервера

---

## Приглашения (команда -> участник)

- GET `/api/marathons/:slug/my-invitations`
  - Ответ 200 `{ "invitations": [{ "id": "...", "teamId": "...", "teamName": "...", "message": "...", "createdAt": "..." }, ...] }`
  - Ошибки
    - 401 - не авторизован
    - 403 - не участник марафона
    - 404 - марафон не найден
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/my-invitations/:invitationId/accept`
  - Ответ 200 `{ "status": "ok", "teamId": "..." }`
  - Ошибки
    - 401 - не авторизован
    - 403 - уже в команде
    - 404 - марафон или приглашение не найдено
    - 409 - приглашение уже обработано или команда заполнена
    - 500 - внутренняя ошибка сервера

- POST `/api/marathons/:slug/my-invitations/:invitationId/decline`
  - Ответ 200 `{ "status": "ok" }`
  - Ошибки
    - 401 - не авторизован
    - 404 - марафон или приглашение не найдено
    - 409 - приглашение уже обработано
    - 500 - внутренняя ошибка сервера

---

## Справочники

- GET `/api/references/roles`
  - Ответ 200 `{ "roles": [{ "id": "programmer", "name": "Программист" }, { "id": "designer", "name": "Дизайнер" }, ...] }`
  - Ошибки
    - 500 - внутренняя ошибка сервера

- GET `/api/references/technologies`
  - Ответ 200 `{ "technologies": [{ "id": "unity", "name": "Unity" }, { "id": "unreal", "name": "Unreal Engine" }, ...] }`
  - Ошибки
    - 500 - внутренняя ошибка сервера

- GET `/api/references/management-types`
  - Ответ 200 `{ "managementTypes": [{ "id": "scrum", "name": "Scrum" }, { "id": "kanban", "name": "Kanban" }, ...] }`
  - Ошибки
    - 500 - внутренняя ошибка сервера

- GET `/api/references/genres`
  - Ответ 200 `{ "genres": [{ "id": "rpg", "name": "RPG" }, { "id": "platformer", "name": "Платформер" }, ...] }`
  - Ошибки
    - 500 - внутренняя ошибка сервера
