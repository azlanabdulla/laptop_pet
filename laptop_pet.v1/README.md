# laptop_pet (Nova Core)

A persistent holographic desktop AI companion built with Electron, React, and Three.js. This application serves as a dynamic, transparent, and always-on-top pet that reacts to your activity and system events.

When you first open the app, your companion will ask for your name and let you name them!

## Features

- **Customizable Companion:** Name your pet and choose your own display name on the first run.
- **Holographic UI:** Persistent transparent widget with an always-on-top, draggable orb.
- **Emotion Engine:** Cursor-tracking eyes and physics-based drag deformation. The pet switches between happy, thinking, working, sleeping, excited, error, celebration, and listening states.
- **Productivity & Context:** Built-in Pomodoro progress ring, quick notes, profile, and system telemetry awareness.
- **Modular Architecture:** Features a plugin host for local AI integration and background watchers.

---

## 🚀 Download & Install

You can simply download the pre-built application to get started immediately:

1. Go to the **[Releases](../../releases)** tab (or look for the `nova-pet Setup.exe` file if uploaded directly).
2. Download the `.exe` file.
3. Run the installer. Your new companion will launch and ask for a name!

Double-click the orb to open its control panel.

---

## 🛠️ Developer Setup (Clone & Run)

If you'd like to modify or build the application from the source code, follow these steps.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### 1. Clone the repository
```powershell
git clone https://github.com/azlanabdulla/laptop_pet.git
cd laptop_pet
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Run in Development Mode
```powershell
npm run dev
```
This will start both the Vite development server and the Electron application.

### 4. Build for Production
To package the application into an `.exe` file for distribution:
```powershell
npm run package
```
The resulting setup executable will be located in the `dist` folder.

---

## Architecture Details

- **Main Process (Electron):** Manages native OS access, SQLite database (`better-sqlite3`), tray behavior, monitoring, and plugins.
- **Renderer Process (React):** Isolated and sandboxed behind a preload API. Renders the transparent overlay and 3D graphics using Three.js and Framer Motion.
- **Persistence:** User settings, names, and notes are saved locally in a SQLite database.
