# Suno API — Generate flow

Tóm tắt cơ chế wrapper gọi thành công API tạo nhạc của Suno (verified 2026-05). Mọi endpoint là internal API của `suno.com/create`; không có API công khai.

## 5 bước

```
1. Cookie  →  Clerk auth  →  JWT
2. JWT + headers anti-bot  →  POST /api/user/create_session_id/  →  session_id
3. session_id  +  full payload  →  POST /api/generate/v2-web/  →  2 clip "submitted"
4. Poll GET /api/feed/v2?ids=...  →  status: streaming/complete
5. audio_url từ response  →  player
```

## Headers bắt buộc

Sai 1 header → 422 `token_validation_failed`.

| Header | Giá trị | Ghi chú |
|---|---|---|
| `Authorization` | `Bearer <jwt>` | Refresh từ Clerk mỗi keepAlive |
| `device-id` | UUID lowercase | `SUNO_DEVICE_ID` env hoặc `ajs_anonymous_id` cookie |
| `browser-token` | `{"token":"<base64({\"timestamp\":Date.now()})>"}` | Sinh mới **mỗi request** |
| `User-Agent` | Chrome 148 macOS đầy đủ | **Phải khớp `sec-ch-ua`** |
| `sec-ch-ua` | `"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"` | Khớp UA |
| `sec-ch-ua-mobile` | `?0` | |
| `sec-ch-ua-platform` | `"macOS"` | |
| `origin` | `https://suno.com` | |
| `referer` | `https://suno.com/` | |
| `Cookie` | Cookie jar | Khi fold Set-Cookie chỉ giữ `name=value`, bỏ `expires/Max-Age/Path/Domain/SameSite/...` |

## Body `POST /api/generate/v2-web/`

```json
{
  "token": null,
  "generation_type": "TEXT",
  "mv": "chirp-v3-5",
  "prompt": "",
  "gpt_description_prompt": "a happy song",
  "make_instrumental": false,
  "user_uploaded_images_b64": null,
  "metadata": {
    "web_client_pathname": "/create",
    "is_max_mode": false,
    "create_mode": "simple",
    "user_tier": "<SUNO_USER_TIER>",
    "create_session_token": "<từ bước 2>",
    "disable_volume_normalization": false,
    "lyrics_model": "default"
  },
  "override_fields": [],
  "cover_clip_id": null, "cover_start_s": null, "cover_end_s": null,
  "persona_id": null,
  "artist_clip_id": null, "artist_start_s": null, "artist_end_s": null,
  "continue_clip_id": null, "continued_aligned_prompt": null, "continue_at": null,
  "transaction_uuid": "<random uuidv4>",
  "token_provider": null
}
```

Response 200 trả về `clips: [{id, status: "submitted"}, ...]` — **2 clip mỗi request**, `audio_url` còn rỗng.

## Status code

| HTTP | error_type | Fix |
|---|---|---|
| 200 | — | Poll bước 4 |
| 403 | `permission_denied` | `mv` không thuộc quyền account; check `/api/session/` → `models[].can_use` |
| 422 | `token_validation_failed` | UA/sec-ch-ua mismatch, browser-token sai, hoặc cookie jar bẩn |
| 401 | — | JWT expired; wrapper sẽ tự `keepAlive()` |

## Poll audio

`GET /api/feed/v2?ids=<csv>` (wrapper expose qua `GET /api/get?ids=...`).

| status | `audio_url` | Hành động |
|---|---|---|
| `submitted` / `queued` | empty | Sleep 5s, poll lại |
| `streaming` | **có** | Trả về user; file vẫn đang render bản final |
| `complete` | **có** | Final MP3 |
| `error` | empty | Xem `metadata.error_message` |

Timing free tier: `submitted → streaming` ~10–30s, `streaming → complete` ~30–90s.

## Code client mẫu

```js
async function generate(prompt) {
  const r = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, wait_audio: false })
  });
  const clips = await r.json();
  const ids = clips.map(c => c.id).join(',');

  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    await new Promise(res => setTimeout(res, 5000));
    const data = await (await fetch(`http://localhost:3000/api/get?ids=${ids}`)).json();
    if (data.every(c => c.status === 'streaming' || c.status === 'complete')) return data;
    if (data.every(c => c.status === 'error')) throw new Error(data[0].error_message);
  }
  throw new Error('timeout');
}
```

## Env cần có

| Biến | Lấy ở đâu | TTL |
|---|---|---|
| `SUNO_COOKIE` | DevTools → Network → bất kỳ request `suno.com` → header `Cookie` (phải có `__client`) | Vài tuần |
| `SUNO_DEVICE_ID` | Cookie `ajs_anonymous_id` (cùng trong `SUNO_COOKIE`) | Vĩnh viễn |
| `SUNO_USER_TIER` | DevTools → Network → 1 request `POST /api/generate/v2-web/` → body `metadata.user_tier` | Theo account, không expire |

`create_session_token` **không cần** env — wrapper tự fetch qua `POST /api/user/create_session_id/` mỗi lần generate (TTL 15 phút).

## Endpoint reference

| Wrapper route | Suno endpoint |
|---|---|
| `POST /api/generate` (simple) | `POST /api/generate/v2-web/` |
| `POST /api/custom_generate` | `POST /api/generate/v2-web/` (`create_mode: "custom"`) |
| `POST /api/extend_audio` | `POST /api/generate/v2-web/` (`continue_clip_id`, `continue_at`) |
| `GET /api/get?ids=...` | `GET /api/feed/v2?ids=...` |
| `POST /api/concat` | `POST /api/generate/concat/v2/` |
| `GET /api/get_limit` | `GET /api/billing/info/` |
| auth (internal) | `auth.suno.com/v1/client/sessions/{sid}/tokens` (Clerk) |
| session token (internal) | `POST /api/user/create_session_id/` |
