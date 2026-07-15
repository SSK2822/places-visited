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
export const firebaseConfig = null

// Google account emails allowed to edit places.
// Must match the list inside firestore.rules.
export const EDITOR_EMAILS = [
  // 'you@gmail.com',
  // 'her@gmail.com',
]
