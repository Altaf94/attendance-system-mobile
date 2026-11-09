# Attendance System (Mobile)

A React Native (TypeScript) app for QR-code-based attendance at events, with event management, user management, service requisitions and reports.

## Features

- Login and user registration; user management screen
- Event creation and management
- QR code generation and QR scanning check-in, with a scan cooldown
- Backdated attendance entry
- Service requisitions with an approval flow
- Reports, with PDF export (react-native-html-to-pdf)
- In-app update checker (Play Store)

## Tech stack

- **Mobile:** React Native, TypeScript
- **Navigation:** React Navigation (native stack)
- **QR:** react-native-qrcode-svg, react-native-camera-kit
- **Other:** AsyncStorage, device-info, date picker, html-to-pdf

## Project structure

```
src/
  screens/     Login, Dashboard, CheckIn, QRScanner, GenerateQR, AddEvent, ManageEvents,
               UserManagement, RegisterUser, ServiceRequisition(s), BackdatedAttendance, Reports
  components/  ScreenLayout, FormField, PrimaryButton, modals, toast, QRCodeDisplay
  services/    api.ts
```

## Getting started

```bash
npm install
npm start
npm run android
npm run build:aab    # release bundle for Play Store
```

## Screenshots

<!-- Add 2-3 screenshots here: docs/screenshots/*.png -->

## Author

Built by **Altaf Hassan**, Software Engineer (React Native & full-stack). [Portfolio](https://altaf94-portfolio.netlify.app) · [LinkedIn](https://linkedin.com/in/altaf-hassan)
