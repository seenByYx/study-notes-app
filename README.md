# Study Notes App

## Local Setup (MongoDB + Auth)

1. Install dependencies:
```bash
npm install
```

2. Create `study-notes-app/.env.local`:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@microcluster.w0f9z50.mongodb.net/study_notes?retryWrites=true&w=majority&appName=microcluster
NEXTAUTH_SECRET=<random-64-char-secret>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
OWNER_EMAIL=<your-email-used-for-first-owner-login>
```

3. In Google Cloud OAuth client, add redirect URI:
```text
http://localhost:3000/api/auth/callback/google
```

4. Start the app:
```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Telegram Mini App Setup

Add these variables to `.env.local` (and Vercel project env for production):
```env
TELEGRAM_BOT_TOKEN=<from-botfather>
TELEGRAM_BOT_USERNAME=<your-bot-username-without-@>
TELEGRAM_WEB_APP_URL=https://study-notes-rho.vercel.app/telegram
TELEGRAM_WEBHOOK_SECRET=<long-random-secret>
GOOGLE_DRIVE_ROOT_FOLDER_ID=<drive-root-folder-id>
GOOGLE_DRIVE_PUBLIC=true
# optional: restrict who can upload files via bot
TELEGRAM_ALLOWED_CHAT_IDS=123456789,987654321

# Drive auth option A (recommended when service-account keys are blocked):
GOOGLE_DRIVE_CLIENT_ID=<oauth-client-id>
GOOGLE_DRIVE_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_DRIVE_REFRESH_TOKEN=<offline-refresh-token>

# Drive auth option B (optional fallback):
# GOOGLE_SERVICE_ACCOUNT_JSON=<single-line-json-for-service-account>
```

Webhook endpoint used by this project:
```text
POST /api/telegram/webhook
```

After deployment, set webhook (PowerShell):
```powershell
$token = "<bot-token>"
$secret = "<webhook-secret>"
$webhookUrl = "https://study-notes-rho.vercel.app/api/telegram/webhook"
Invoke-RestMethod -Method POST -Uri "https://api.telegram.org/bot$token/setWebhook" -Body @{
  url = $webhookUrl
  secret_token = $secret
}
```

Set bot menu button so users can launch your mini app from the bot:
```powershell
$token = "<bot-token>"
$menu = '{"type":"web_app","text":"Open Study Notes","web_app":{"url":"https://study-notes-rho.vercel.app/telegram"}}'
Invoke-RestMethod -Method POST -Uri "https://api.telegram.org/bot$token/setChatMenuButton" -Body @{
  menu_button = $menu
}
```

Behavior implemented:
1. Telegram sends updates to `/api/telegram/webhook`.
2. On `/start`, `/app`, or `/webapp`, your bot replies with an inline Web App button.
3. Button opens `TELEGRAM_WEB_APP_URL` inside Telegram.
4. On `/upload`, bot starts guided flow and asks scope/key fields one by one.
5. Subject step shows existing subjects as Telegram buttons.
6. If required subject is missing, use `Add new subject` button and enter new subject name/key.
7. After metadata answers, bot asks for document and accepts only `.pdf` and `.pptx`.
8. Bot uploads to Google Drive folders and creates note record in MongoDB.

Upload commands:
```text
/upload  start guided upload
/cancel  cancel current upload flow
/help    show supported commands
```

Allowed note kind values:
```text
notes, question-paper, assignment, reference
```

## Role Behavior

1. `owner`
- Can promote/demote admins and manage users from owner console.
- Can add, edit, and delete notes.

2. `admin`
- Can add, edit, and delete notes from subject pages.

3. `user`
- Can view notes and comment (if signed in).

## First Local Test Flow

1. Sign up or Google sign-in with the same email as `OWNER_EMAIL`.
2. Confirm owner console appears on home page.
3. Create/sign in with a second account, then promote it to `admin`.
4. Sign in as admin and test add/edit/delete note (Google Drive link works).
5. Sign in as owner and verify you can both manage admins and manage notes.
