import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { env, isFirebaseConfigured } from '../config/env'

let cachedAuth: ReturnType<typeof getAuth> | null = null

export const getFirebaseAuth = () => {
	if (cachedAuth) {
		return cachedAuth
	}

	if (!isFirebaseConfigured()) {
		throw new Error('Firebase config is missing. Add VITE_FIREBASE_* values in frontend/.env.')
	}

	const app = getApps()[0] ?? initializeApp({
		apiKey: env.firebase.apiKey!,
		authDomain: env.firebase.authDomain!,
		projectId: env.firebase.projectId!,
		storageBucket: env.firebase.storageBucket!,
		messagingSenderId: env.firebase.messagingSenderId!,
		appId: env.firebase.appId!,
		measurementId: env.firebase.measurementId || undefined,
	})
	cachedAuth = getAuth(app)
	return cachedAuth
}
