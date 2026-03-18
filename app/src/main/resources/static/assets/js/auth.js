/**
 * Fresh Greens — Firebase Authentication Module
 *
 * Handles Firebase SDK initialization, Google/GitHub sign-in,
 * token retrieval, and session management with Spring Boot backend.
 *
 * IMPORTANT: Replace the firebaseConfig below with your own Firebase project config.
 */
const FGAuth = (function () {
    'use strict';

    // ---- Firebase Configuration ----
    const firebaseConfig = {
  apiKey: "AIzaSyAPhvJ70qmuQ2U4dGqIFFrVzK4OElXf09U",
  authDomain: "fresh-greens-d6ded.firebaseapp.com",
  projectId: "fresh-greens-d6ded",
  storageBucket: "fresh-greens-d6ded.firebasestorage.app",
  messagingSenderId: "441155473345",
  appId: "1:441155473345:web:af4f1b249d1c03673ca940",
  measurementId: "G-JSL6WCGXGS"
};


    let _currentUser = null;
    let _initialized = false;

    /**
     * Initialize Firebase SDK (call once on page load)
     */
    function init() {
        if (_initialized) return;
        firebase.initializeApp(firebaseConfig);
        _initialized = true;

        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                _currentUser = user;
                $(document).trigger('fg:auth:loggedin', [user]);
            } else {
                _currentUser = null;
                $(document).trigger('fg:auth:loggedout');
            }
        });
    }

    /**
     * Sign in with Google
     */
    function signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        return _signInWithPopup(provider);
    }

    /**
     * Sign in with GitHub
     */
    function signInWithGitHub() {
        const provider = new firebase.auth.GithubAuthProvider();
        provider.addScope('read:user');
        provider.addScope('user:email');
        return _signInWithPopup(provider);
    }

    /**
     * Common popup sign-in flow
     */
    function _signInWithPopup(provider) {
        return firebase.auth().signInWithPopup(provider)
            .then(function (result) {
                return result.user.getIdToken();
            })
            .then(function (idToken) {
                // Send token to backend to create session
                return _loginToBackend(idToken);
            });
    }

    /**
     * Send Firebase ID token to Spring Boot backend
     */
    function _loginToBackend(idToken) {
        return $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ idToken: idToken })
        }).then(function (response) {
            if (response.success) {
                localStorage.setItem('fg_user', JSON.stringify(response.data));
                $(document).trigger('fg:auth:session_created', [response.data]);
                return response.data;
            } else {
                throw new Error(response.message);
            }
        });
    }

    /**
     * Sign out — clear Firebase auth + backend session
     */
    function signOut() {
        return firebase.auth().signOut()
            .then(function () {
                return $.ajax({
                    url: '/api/auth/logout',
                    method: 'POST'
                });
            })
            .then(function () {
                localStorage.removeItem('fg_user');
                _currentUser = null;
                $(document).trigger('fg:auth:loggedout');
            });
    }

    /**
     * Get stored user data from localStorage
     */
    function getUser() {
        if (_currentUser) return _currentUser;
        const stored = localStorage.getItem('fg_user');
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Check if user is logged in (has session)
     */
    function isLoggedIn() {
        return localStorage.getItem('fg_user') !== null;
    }

    /**
     * Get fresh Firebase ID token (for re-authentication if needed)
     */
    function getIdToken() {
        if (_currentUser) {
            return _currentUser.getIdToken(true);
        }
        return Promise.reject('No user signed in');
    }

    /**
     * Check backend session validity
     */
    function checkSession() {
        return $.ajax({
            url: '/api/auth/session',
            method: 'GET'
        }).then(function (response) {
            if (response.success) {
                return response.data;
            }
            // Session expired — clean up
            localStorage.removeItem('fg_user');
            return null;
        }).catch(function () {
            localStorage.removeItem('fg_user');
            return null;
        });
    }

    return {
        init: init,
        signInWithGoogle: signInWithGoogle,
        signInWithGitHub: signInWithGitHub,
        signOut: signOut,
        getUser: getUser,
        isLoggedIn: isLoggedIn,
        getIdToken: getIdToken,
        checkSession: checkSession
    };
})();
