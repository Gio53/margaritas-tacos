# How to push updated code to GitHub

When you change files (e.g. `package.json`, `render.yaml`, or any code) and want those changes on GitHub so Render or Netlify can use them, do this from your **project folder** (the one that has `package.json`, `server/`, `client/`, etc.).

---

## Step 1: Open a terminal in the project folder

- In **Cursor** or **VS Code**: open the terminal (Terminal → New Terminal, or `` Ctrl+` ``). Make sure the current folder is your project (e.g. `C:\Users\riosg\Downloads\margaritas-tacos`).
- Or open **PowerShell** or **Command Prompt** and go to the project folder:
  ```powershell
  cd C:\Users\riosg\Downloads\margaritas-tacos
  ```
  (Use your real path if it’s different.)

---

## Step 2: See what changed

Run:

```powershell
git status
```

You should see a list of “modified” files (e.g. `package.json`, `render.yaml`). Those are the updates you’re about to push.

---

## Step 3: Stage all changes

Run:

```powershell
git add .
```

The dot means “all changed files in this folder.” Your `.env` file won’t be added because it’s in `.gitignore`.

---

## Step 4: Commit with a short message

Run:

```powershell
git commit -m "Fix Render build: move esbuild to dependencies"
```

You can change the message between the quotes to whatever you like (e.g. “Update for deploy”).

---

## Step 5: Push to GitHub

Run:

```powershell
git push origin main
```

- If it asks for **username**: use your GitHub username (e.g. `Gio53`).
- If it asks for **password**: use a **Personal Access Token**, not your GitHub password.  
  To create one: GitHub → your profile (top right) → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**. Give it a name, check **repo**, then generate and copy the token. Paste that when the terminal asks for a password.

---

## Step 6: Confirm on GitHub

Open your repo in the browser:  
`https://github.com/Gio53/margaritas-tacos`

Refresh the page. The latest commit and updated files (e.g. `package.json` with `esbuild` in dependencies) should appear. Render will use the new code on the next deploy (automatic on push, or trigger **Manual Deploy** in the Render dashboard).

---

## Quick copy-paste (all steps)

```powershell
cd C:\Users\riosg\Downloads\margaritas-tacos
git status
git add .
git commit -m "Fix Render build: move esbuild to dependencies"
git push origin main
```

(Change the path in the first line if your project is somewhere else.)
