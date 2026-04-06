const read = (key: keyof ImportMetaEnv): string => (import.meta.env[key] || '').trim()

const required = (key: keyof ImportMetaEnv): string | null => {
  const value = read(key)
  return value ? value : null
}

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL') || '',
  firebase: {
    apiKey: required('VITE_FIREBASE_API_KEY'),
    authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: required('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: required('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: required('VITE_FIREBASE_APP_ID'),
    measurementId: read('VITE_FIREBASE_MEASUREMENT_ID') || null,
  },
}

export const isFirebaseConfigured = () =>
  Boolean(
    env.firebase.apiKey &&
      env.firebase.authDomain &&
      env.firebase.projectId &&
      env.firebase.storageBucket &&
      env.firebase.messagingSenderId &&
      env.firebase.appId,
  )
