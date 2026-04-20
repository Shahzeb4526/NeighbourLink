# NeighbourLink

NeighbourLink is a mobile app prototype for borrowing and lending items between neighbours. I built this as my Final Year Project for the BSc Computer Science programme at Kingston University.

The main idea is simple: make local borrowing easier and more organised in one place, instead of arranging everything through random messages.

## Project Overview

When people borrow things informally, there are a few common issues:

- trust can be low
- communication can be messy
- it is not always clear what is available
- people worry about items not being returned
- it is hard to keep track of who borrowed what

## Main Features

- User registration and login
- Session management for signed-in users
- Profile creation and updates
- Item listing and item creation
- Borrow request management
- Messaging between users
- Unread message notifications
- Item deletion and activity management
- Multi-screen navigation
- Prototype settings page

## Technology Stack

- React Native
- Expo
- Supabase
- JavaScript

## Functional Requirements Scope

The project is mapped to these requirements from the brief:

- FR1: User Verification
- FR2: Item Listing
- FR3: Borrowing Management
- FR4: Messaging System
- FR5: Notifications and Reminders
- FR6: Borrowing Rules
- FR7: Trust Ratings
- FR8: Map View

Some requirements are more complete than others because this is still a prototype.

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Expo Go app (optional for physical device testing)

### Install

```bash
npm install
```

### Run Development Server

```bash
npm start
```

After that, you can open the app using:

- Expo Go on a phone (scan QR code)
- Android emulator
- iOS simulator (macOS)
- Web preview

## Build Commands

These are the commands I use most:

```bash
npm run eas:preview:android
```

or

```bash
npm run eas:build -- --profile preview --platform android
```

Production build:

```bash
npm run eas:production:android
```

## Known Issue and Workaround

If running eas build directly fails with:

`tar -C /home/expo/workingdir/build --strip-components 1 -zxf /home/expo/workingdir/project.tar.gz exited with non-zero code: 2`

use the staged build script (npm run eas:build ... or npm run eas:preview:android).

This avoids archive issues that can happen when building from a OneDrive-synced folder.

## Project Structure

```text
NeighbourLink/
├── App.js
├── app.json
├── eas.json
├── screens/
│   ├── CommunityScreen.js
│   ├── EditProfileScreen.js
│   ├── HomeScreen.js
│   ├── LoginScreen.js
│   ├── MessagesScreen.js
│   ├── MyItemsScreen.js
│   ├── ProfileScreen.js
│   └── SettingsScreen.js
├── services/
│   ├── apiClient.js
│   ├── borrowRequestsService.js
│   ├── itemsService.js
│   ├── messagesService.js
│   ├── supabaseClient.js
│   └── usersService.js
├── scripts/
│   ├── easBuildFromTemp.mjs
│   └── expoDoctorClean.mjs
└── supabase/
	└── items_schema.sql
```
