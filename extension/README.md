# VaultKey Chrome Extension (Manifest V3)

Ultra-secure credential vault, password autofill, and license key manager directly connected to the VaultKey backend database (`http://localhost:5000/api`).

## Features
- **Direct Database Storage**: Saves passwords, API keys, certificates, and tokens with AES-256-GCM encryption straight into MongoDB.
- **Active Tab Auto-Detection**: Automatically reads current tab URL and domain.
- **Vault Search & 1-Click Decrypt**: Search credentials and decrypt plain values instantly.
- **Instant Autofill**: Click **"Autofill Page"** to automatically fill username & password fields in your active browser tab.
- **High-Entropy Generator**: Generate passwords and license keys on the fly.
- **Apple Liquid Glass UI**: Sleek, modern dark glassmorphism popup with glowing indicators.

---

## How to Install in Google Chrome

1. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions
   ```
2. In the top-right corner, turn **ON** the switch for **Developer mode**.
3. Click the button **Load unpacked** (top-left).
4. Select the directory:
   ```
   A:\Coding\License_Server\extension
   ```
5. Click **Select Folder**. The **VaultKey** extension icon will now appear in your Chrome toolbar!
6. Click the extension icon to sign in (`admin@example.com` / `admin`) and start saving and autofilling credentials.
