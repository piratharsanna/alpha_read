# AlphaRead

AlphaRead is a cheerful alphabet-learning app for young children. The native app uses **React Native with Expo**, so the same JavaScript codebase runs on Android and iOS. The original `index.html` remains available as a browser preview.

## Run on Android or iOS

1. Install Node.js (LTS) and the Expo Go app on your phone.
2. In this repository, run:

   ```sh
   npm install
   npx expo start
   ```

3. Scan the QR code with Expo Go on Android, or the iPhone Camera app on iOS. To launch an available simulator, use `npm run android` or `npm run ios`.

For store-ready native builds, use [Expo Application Services (EAS)](https://docs.expo.dev/build/introduction/) or generate the native projects with `npx expo prebuild`.

## Features

- Big, colorful, touch-friendly letter cards with friendly picture hints
- Tap any letter to hear its name and example word using native text-to-speech
- Choose a boy-style or girl-style reading voice; the app picks a matching named device voice when one is available and otherwise uses a different pitch
- Progress saved on the device, plus vowel and heard-letter filters
- Sound control, practice reset, and accessible button labels
- No account, ads, analytics, or external image downloads

## Voice note

Voice names and availability vary by Android/iOS device, language, and installed speech voices. The boy/girl choices are friendly voice styles, not guarantees of a particular speaker or a recorded child voice. Parents can install or select speech voices in the device accessibility or text-to-speech settings.

## Web preview

Open `index.html` in a browser to try the earlier lightweight web version.
