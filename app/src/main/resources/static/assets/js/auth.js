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
        apiKey: "AIzaSyDDMRDSgm0gaKa0qIxfUpzuVikvg5j6Eys",
        authDomain: "fresh-greens-cz007.firebaseapp.com",
        projectId: "fresh-greens-cz007",
        storageBucket: "fresh-greens-cz007.firebasestorage.app",
        messagingSenderId: "315300255753",
        appId: "1:315300255753:web:af9a19ecd959368a43c0d8",
        measurementId: "G-YGF6C84JG7"
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

        // Complete OAuth redirect flow if popup fallback was used
        _handleRedirectResult();

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
        return _signIn(provider);
    }

    /**
     * Sign in with GitHub
     */
    function signInWithGitHub() {
        const provider = new firebase.auth.GithubAuthProvider();
        provider.addScope('read:user');
        provider.addScope('user:email');
        return _signIn(provider);
    }

    /**
     * Common popup sign-in flow
     */
    function _signIn(provider) {
        return _signInWithPopup(provider)
            .catch(function (err) {
                if (_shouldFallbackToRedirect(err)) {
                    // Popup flows can fail because of browser COOP/popup restrictions.
                    // Redirect flow avoids cross-window access issues.
                    sessionStorage.setItem('fg_auth_redirect_pending', '1');
                    return firebase.auth().signInWithRedirect(provider);
                }
                throw err;
            });
    }

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

    function _handleRedirectResult() {
        const pendingRedirect = sessionStorage.getItem('fg_auth_redirect_pending') === '1';

        firebase.auth().getRedirectResult()
            .then(function (result) {
                if (pendingRedirect) {
                    sessionStorage.removeItem('fg_auth_redirect_pending');
                }
                if (!result || !result.user) {
                    return;
                }
                return result.user.getIdToken()
                    .then(function (idToken) {
                        return _loginToBackend(idToken);
                    });
            })
            .catch(function (err) {
                if (pendingRedirect) {
                    sessionStorage.removeItem('fg_auth_redirect_pending');
                }
                $(document).trigger('fg:auth:error', [err]);
            });
    }

    function _shouldFallbackToRedirect(err) {
        if (!err) return false;
        const code = (err.code || '').toLowerCase();
        const message = (err.message || '').toLowerCase();

        return code === 'auth/popup-blocked' ||
               code === 'auth/cancelled-popup-request' ||
             code === 'auth/popup-closed-by-user' ||
               message.includes('cross-origin-opener-policy') ||
               message.includes('window.closed');
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
        }).then(
            function (response) {
                if (response.success) {
                    localStorage.setItem('fg_user', JSON.stringify(response.data));
                    $(document).trigger('fg:auth:session_created', [response.data]);
                    return response.data;
                }
                throw new Error(response.message || 'Login failed');
            },
            function (jqXHR, textStatus, errorThrown) {
                const apiMessage = jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.message
                    ? jqXHR.responseJSON.message
                    : null;
                const message = apiMessage || errorThrown || textStatus || 'Login API request failed';
                const error = new Error(message);
                error.code = 'auth/backend-login-failed';
                error.httpStatus = jqXHR ? jqXHR.status : undefined;
                throw error;
            }
        );
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
