# Sea Crew Guide API Contract (Tencent Migration)

This document defines the backend API contract used by the migrated frontend.

## Base

- Base URL: `VITE_API_BASE_URL`
- Content-Type: `application/json`
- Auth header: `Authorization: Bearer <token>`

## Common Response

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Error:

```json
{
  "ok": false,
  "message": "Human readable error",
  "code": "ERROR_CODE"
}
```

The frontend currently accepts direct payloads too (not strictly wrapped in `{ ok, data }`), but backend is recommended to return consistent structure.

---

## 1) Auth

### POST `/auth/register`

Request:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Response:

```json
{
  "user": {
    "id": "u_123",
    "email": "user@example.com"
  },
  "accessToken": "jwt_token"
}
```

### POST `/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Response:

```json
{
  "user": {
    "id": "u_123",
    "email": "user@example.com"
  },
  "accessToken": "jwt_token"
}
```

### POST `/auth/logout`

Request:

```json
{}
```

Response:

```json
{
  "success": true
}
```

---

## 2) Profile

### GET `/me/profile`

Auth required.

Response:

```json
{
  "id": "u_123",
  "nickname": "new_user",
  "level": 1,
  "xp": 0,
  "current_task": 1,
  "selected_job": null
}
```

### POST `/profiles/init`

Auth required. Called right after register.

Request:

```json
{
  "nickname": "new_user",
  "level": 1,
  "xp": 0,
  "current_task": 1
}
```

Response:

```json
{
  "id": "u_123",
  "nickname": "new_user",
  "level": 1,
  "xp": 0,
  "current_task": 1
}
```

### PATCH `/me/profile`

Auth required. Partial update.

Request example:

```json
{
  "xp": 120,
  "level": 2,
  "current_task": 3,
  "selected_job": "restaurant"
}
```

Response:

```json
{
  "success": true
}
```

---

## 3) Tasks

### GET `/tasks`

Auth required.

Response:

```json
[
  {
    "id": 1,
    "title": "完成五维测评",
    "description": "先完成基础测评",
    "stage": 1,
    "sort_order": 1,
    "task_type": "assessment",
    "xp_reward": 20
  }
]
```

### GET `/me/tasks`

Auth required.

Response:

```json
[
  {
    "task_id": 1,
    "status": "active"
  }
]
```

Allowed status enum:

- `locked`
- `active`
- `pending_review`
- `rejected`
- `completed`

### POST `/me/tasks/init`

Auth required.

Request:

```json
{
  "tasks": [
    { "task_id": 1, "status": "active" },
    { "task_id": 2, "status": "locked" }
  ]
}
```

Response:

```json
[
  { "task_id": 1, "status": "active" },
  { "task_id": 2, "status": "locked" }
]
```

### POST `/me/tasks/complete`

Auth required. Complete current task and activate next task.

Request:

```json
{
  "taskId": 1
}
```

Response:

```json
{
  "success": true
}
```

### GET `/tasks/first?stage=1&sort_order=1`

Auth required.

Response:

```json
{
  "id": 1
}
```

### GET `/tasks/by-title?title=...`

Auth required.

Response:

```json
{
  "id": 2,
  "title": "选择目标岗位"
}
```

### GET `/tasks/by-stage-order?stage=1&sort_order=3`

Auth required.

Response:

```json
{
  "id": 3
}
```

### GET `/me/tasks/status?task_id=2`

Auth required.

Response:

```json
{
  "task_id": 2,
  "status": "active"
}
```

### POST `/me/tasks/upsert`

Auth required.

Request:

```json
{
  "task_id": 2,
  "status": "completed",
  "completed_at": "2026-04-08T10:00:00.000Z"
}
```

Response:

```json
{
  "success": true
}
```

---

## 4) Assessment

### GET `/me/assessment/latest`

Auth required.

Response:

```json
{
  "user_id": "u_123",
  "english_score": 78,
  "appearance_score": 70,
  "service_score": 82,
  "knowledge_score": 65,
  "document_score": 74,
  "total_score": 74,
  "created_at": "2026-04-08T10:00:00.000Z"
}
```

### POST `/me/assessment`

Auth required.

Request:

```json
{
  "english_score": 78,
  "appearance_score": 70,
  "service_score": 82,
  "knowledge_score": 65,
  "document_score": 74,
  "total_score": 74
}
```

Response:

```json
{
  "user_id": "u_123",
  "english_score": 78,
  "appearance_score": 70,
  "service_score": 82,
  "knowledge_score": 65,
  "document_score": 74,
  "total_score": 74
}
```

---

## 5) Check-ins

### GET `/me/checkins/today?date=YYYY-MM-DD`

Auth required.

Response:

```json
{
  "id": "c_001",
  "checked_at": "2026-04-08"
}
```

If no record: return `null`.

### GET `/me/checkins`

Auth required.

Response:

```json
[
  { "checked_at": "2026-04-08" },
  { "checked_at": "2026-04-07" }
]
```

### POST `/me/checkins`

Auth required.

Request:

```json
{
  "checked_at": "2026-04-08",
  "sentence": "Good morning! Welcome aboard.",
  "xp_earned": 10
}
```

Response:

```json
{
  "success": true
}
```

---

## Error Codes (recommended)

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_UNAUTHORIZED`
- `PROFILE_NOT_FOUND`
- `TASK_NOT_FOUND`
- `TASK_INVALID_STATUS`
- `CHECKIN_ALREADY_DONE`
- `VALIDATION_ERROR`
- `INTERNAL_ERROR`

---

## Frontend Compatibility Notes

- Auth methods in frontend expect:
  - register/login -> `{ user, accessToken }` (or `{ user, token }`)
- `GET /me/profile` should return direct profile object.
- Task/checkin/assessment endpoints are currently consumed as direct payloads.
- Keep `task.status` strictly within:
  - `locked | active | pending_review | rejected | completed`
