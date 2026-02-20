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

## Role Behavior

1. `owner`
- Can promote/demote admins and manage users from owner console.
- Cannot add or remove notes.

2. `admin`
- Can add, edit, and delete notes from subject pages.

3. `user`
- Can view notes and comment (if signed in).

## First Local Test Flow

1. Sign up or Google sign-in with the same email as `OWNER_EMAIL`.
2. Confirm owner console appears on home page.
3. Create/sign in with a second account, then promote it to `admin`.
4. Sign in as admin and test add/edit/delete note (Google Drive link works).
