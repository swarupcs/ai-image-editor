# ImgGen — Feature Documentation

Complete list of all implemented features. Updated after each successful implementation.

---

## Authentication

### Credentials (Email & Password)
Users can register with name, email, and password. Passwords are hashed with bcrypt (12 rounds). On signup, the user is automatically signed in. Implemented via NextAuth v5 Credentials provider + Prisma adapter.

- **Frontend**: `/signin`, `/signup` pages with form validation and inline error messages.
- **Backend**: `POST /api/signup` creates the user; NextAuth credentials provider handles login.

### Google OAuth
One-click sign-in with Google. Redirects to `/dashboard` on success.

- **Frontend**: "Continue with Google" button on both signin and signup pages.
- **Backend**: NextAuth Google provider with `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` env vars.
- **Required env**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### GitHub OAuth
One-click sign-in with GitHub. Redirects to `/dashboard` on success.

- **Frontend**: "Continue with GitHub" button on both signin and signup pages.
- **Backend**: NextAuth GitHub provider with `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` env vars.
- **Required env**: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

### Route Protection
All routes under `/dashboard`, `/editor`, `/profile`, `/gallery/user` require authentication. Middleware redirects unauthenticated users to `/signin`. Authenticated users visiting auth pages are redirected to `/dashboard`.

- **File**: `src/middleware.ts` using a lightweight edge-safe NextAuth config.

---

## Profile Management

### View Profile
Displays user avatar (initials fallback or OAuth profile image), display name, email, member since date, and connected OAuth provider badges (Google, GitHub, Email & Password).

- **Frontend**: `/profile` page.
- **Backend**: `GET /api/user` returns name, email, image, hasPassword flag, accounts, createdAt.

### Edit Display Name
Inline form to update the display name. Save button is disabled when the name matches the current value.

- **Frontend**: Form in `/profile` page with success/error feedback.
- **Backend**: `PATCH /api/user` with `{ name }` body.

### Change Password
Available only to credential accounts (users who signed up with email/password). Verifies current password before setting the new one.

- **Frontend**: Conditional password section in `/profile` page.
- **Backend**: `PATCH /api/user/password` verifies current password with bcrypt compare, hashes new password.

---

## Editor

### Image Upload
Upload an image via file picker or drag-and-drop anywhere on the canvas.

- **Frontend**: `editor/page.tsx` — file input ref passed to Navbar upload button; drag-and-drop handlers on the canvas area.

### Text-to-Image Generation
Generate an image from a text prompt without uploading anything. Uses Google Gemini `gemini-3-pro-image-preview` model. Switch to the "Generate" tab in the editor empty state.

- **Frontend**: Tab switcher in empty state (`upload` | `generate`). Textarea prompt input + Generate button with loading state and credits check.
- **Backend**: `POST /api/generate` — sends prompt-only request to Gemini, deducts 1 credit on success.
- **Store**: `generateFromPrompt()` in `useEditorStore`.

### AI Inpainting
Paint a mask over a region of the image, type a prompt, and let AI replace only the masked area while seamlessly preserving the rest. Supports brush, eraser, and rectangle selection tools.

- **Frontend**: Canvas-based mask painter in `ImageEditor` component. Left sidebar tool buttons. Prompt input at the bottom.
- **Backend**: `POST /api/edit-image` — sends image + mask + prompt to Gemini, deducts 1 credit.
- **Store**: `generateEdit()` in `useEditorStore`.

### AI Style Filters
One-click style transfer presets: Toonify (2D cartoon), Ghibli Studio (Miyazaki anime), Cyberpunk (neon aesthetic), Oil Painting (impressionist brushstrokes).

- **Frontend**: Filter grid in the left sidebar Filters accordion.
- **Backend**: `POST /api/edit-image` with a detailed style prompt.
- **Store**: `applyFilter(prompt)` in `useEditorStore`.

### Image Expansion (Outpainting)
Expand the canvas to a new aspect ratio with AI-generated content that seamlessly continues the original image. 8 presets: Square (1:1), Wide (16:9), Standard (4:3), Classic (3:2), Cinema (21:9), Story (9:16), Social (4:5), Poster (2:3).

- **Frontend**: Expansion grid in the left sidebar Expansion accordion.
- **Backend**: `POST /api/edit-image` with `aspectRatio` parameter.
- **Store**: `applyExpansion(aspectRatio)` in `useEditorStore`.

### Background Removal
Remove the image background and replace it with a clean white background. One-click from the Editing Options section in the left sidebar.

- **Frontend**: "Remove BG" button in left sidebar (enabled when image is loaded).
- **Backend**: `POST /api/edit-image` with a background removal prompt.
- **Store**: `removeBackground()` in `useEditorStore`.

### AI Image Enhancement
Sharpen, upscale, remove noise and compression artifacts, and improve color vibrancy while preserving composition. One-click from the left sidebar.

- **Frontend**: "AI Enhance" button in left sidebar (enabled when image is loaded).
- **Backend**: `POST /api/edit-image` with an enhancement/upscaling prompt.
- **Store**: `enhanceImage()` in `useEditorStore`.

### Edit History
Every AI-generated result is added to an in-memory history stack. Navigate between versions with undo/redo keyboard shortcuts and the History panel. Click any thumbnail to jump to that version. Clear history keeps only the current image.

- **Frontend**: `RightSidebar` component (history thumbnails). Navbar undo/redo buttons. Layers toggle button.
- **Store**: `history[]`, `historyIndex`, `undo()`, `redo()`, `setHistoryIndex()` in `useEditorStore`.

### Save to Gallery
Save the current canvas image to the user's personal gallery in the database. The save button in the navbar shows a confirmation state after saving.

- **Frontend**: Save button in editor Navbar with loading and "Saved ✓" feedback states.
- **Backend**: `POST /api/images` creates a `GeneratedImage` record with imageData, prompt, and auto-generated title.
- **Store**: `saveCurrentImage(title?)` in `useEditorStore`.

### Export (Download)
Download the current canvas as a PNG file named `imggen-{timestamp}.png`.

- **Frontend**: Export button in editor Navbar.

---

## Usage Credits

### Credit System
Each new user receives **20 free credits**. Every successful AI generation (edit, filter, expansion, background removal, enhancement, text-to-image) deducts 1 credit. Requests are blocked server-side when credits reach 0.

- **Frontend**: Credits badge in editor Navbar and dashboard (purple when > 5, red when ≤ 5). Credits check before enabling the Generate button in text-to-image mode.
- **Backend**: Credit check before processing in `POST /api/edit-image` and `POST /api/generate`. Credit decrement on success. `GET /api/credits` returns current balance.
- **Database**: `credits Int @default(20)` on the `User` model.

---

## Gallery

### Personal Gallery
Browse all saved images in a responsive grid. Toggle each image between public and private. Delete images. Add images to collections via hover overlay.

- **Frontend**: `/gallery/user` page with Images and Collections tabs.
- **Backend**: `GET /api/images` (paginated list), `DELETE /api/images/[id]`, `PATCH /api/images/[id]` (toggle isPublic / update title).

### Public Community Gallery
Browse all images marked as public by any user. Masonry grid layout with hover to reveal the prompt. Author avatar and name shown per image. Server-rendered with 60-second revalidation.

- **Frontend**: `/gallery` page (public, no auth required). Accessible from dashboard.
- **Backend**: `GET /api/gallery` returns paginated public images with user info.

---

## Collections

### Create Collection
Name and create a collection to organize saved images.

- **Frontend**: Collections tab in `/gallery/user` page with inline creation form.
- **Backend**: `POST /api/collections`.

### Add Images to Collection
Add any saved image to one or more collections from the gallery image hover overlay.

- **Frontend**: Collection buttons shown on image hover when collections exist.
- **Backend**: `POST /api/collections/[id]/images` with `{ imageId }` — uses upsert to prevent duplicates.

### Delete Collection
Remove a collection (images are not deleted, only the collection and its links).

- **Frontend**: Delete button on collection card hover.
- **Backend**: `DELETE /api/collections/[id]`.

### View Collection Contents
Browse images within a specific collection.

- **Backend**: `GET /api/collections/[id]` returns collection with all linked images.

---

## Database Schema

```
User              — id, name, email, password, image, credits(20), timestamps
Account           — OAuth provider accounts linked to User
Session           — JWT sessions
VerificationToken — Email verification
GeneratedImage    — id, userId, title, prompt, imageData(Text), isPublic, createdAt
Collection        — id, userId, name, createdAt
CollectionImage   — collectionId + imageId join (unique pair)
```

**Storage note**: Images are stored as base64 data URLs in PostgreSQL `TEXT` columns. For production at scale, migrate `imageData` to Vercel Blob, Cloudinary, or AWS S3 and store URLs instead.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Font | Inter (Google Fonts) |
| State | Zustand (with devtools) |
| Auth | NextAuth v5 beta.30 |
| Database | Prisma 7 + NeonDB (PostgreSQL) |
| DB Adapter | @prisma/adapter-pg |
| AI Model | Google Gemini `gemini-3-pro-image-preview` |
| Icons | Lucide React |
