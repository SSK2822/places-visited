// Firebase web app config — paste yours here to switch the app from
// "GitHub token" mode to live cloud sync (Firestore + Google sign-in).
//
// Get it from: Firebase console → Project settings → Your apps → Web app
// → "SDK setup and configuration". It looks like:
//
// export const firebaseConfig = {
//   apiKey: 'AIza…',
//   authDomain: 'your-project.firebaseapp.com',
//   projectId: 'your-project',
//   storageBucket: 'your-project.appspot.com',
//   messagingSenderId: '…',
//   appId: '…',
// }
//
// This config is safe to commit — it is not a secret. Write access is
// enforced by Firestore security rules (see firestore.rules), not by
// hiding the config.
export const firebaseConfig = {
  apiKey: 'AIzaSyDay9FjzIX-E8gyDC_sIM1m1cUV2WebPvI',
  authDomain: 'places-visited-5d5d2.firebaseapp.com',
  projectId: 'places-visited-5d5d2',
  storageBucket: 'places-visited-5d5d2.firebasestorage.app',
  messagingSenderId: '317004130946',
  appId: '1:317004130946:web:b7ebdeaa75a35cac63a29b',
  measurementId: 'G-X34JG1RZQD',
}

// Google accounts allowed to edit places, and which rating/comment
// field each one owns. Keep the email list in sync with firestore.rules.
export const EDITORS = [
  { email: 'shreyash.kawle@gmail.com', key: 'yk', label: 'YK', name: 'Yash' },
  { email: 'amandaychen1@gmail.com', key: 'ac', label: 'Ac', name: 'Amanda' },
]
