/* ========================================
   Happy Booth — Photobooth Event
   Firebase Authentication
   ======================================== */

(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyA1_Lxx-3S_lKS-vHHwqXVRLfLJ0BKgg3o",
    authDomain: "happy-booth.firebaseapp.com",
    projectId: "happy-booth",
    storageBucket: "happy-booth.firebasestorage.app",
    messagingSenderId: "1041402198608",
    appId: "1:1041402198608:web:11e691bee0d38bf0326f55",
    measurementId: "G-BR14CS2J8T"
  };

  var currentUser = null;
  var authReady = false;
  var authReadyCallbacks = [];

  var protectedPages = { admin: true };
  var authPages = { login: true };

  function init() {
    if (typeof firebase === 'undefined') return;

    firebase.initializeApp(firebaseConfig);

    firebase.auth().onAuthStateChanged(function (user) {
      currentUser = user;
      authReady = true;
      authReadyCallbacks.forEach(function (cb) { cb(user); });
      authReadyCallbacks = [];
    });
  }

  function whenReady() {
    return new Promise(function (resolve) {
      if (authReady) { resolve(currentUser); return; }
      authReadyCallbacks.push(resolve);
    });
  }

  function login(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }

  function logout() {
    return firebase.auth().signOut();
  }

  function getUser() {
    return currentUser;
  }

  function isLoggedIn() {
    return !!currentUser;
  }

  function guardRoute(pageName) {
    if (protectedPages[pageName] && !currentUser) return 'redirect-login';
    if (authPages[pageName] && currentUser) return 'redirect-admin';
    return 'allow';
  }

  window.auth = {
    init: init,
    whenReady: whenReady,
    login: login,
    logout: logout,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    guardRoute: guardRoute
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
