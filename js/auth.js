/* ========================================
   Happy Booth — Photobooth Event
   Firebase Authentication & Authorization
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
  var currentUserRole = null;
  var userDocData = null;
  var authReady = false;
  var authReadyCallbacks = [];

  var protectedPages = { admin: true };
  var userPages = { 'user-dashboard': true };
  var authPages = { login: true, register: true };

  function init() {
    if (typeof firebase === 'undefined') return;

    firebase.initializeApp(firebaseConfig);

    // Initialize Firestore and Storage
    window.fireDb = firebase.firestore();
    window.fireStorage = firebase.storage();

    firebase.auth().onAuthStateChanged(function (user) {
      currentUser = user;
      if (user) {
        // Fetch role from Firestore before resolving
        window.fireDb.collection('users').doc(user.uid).get()
          .then(function (doc) {
            if (doc.exists) {
              userDocData = doc.data();
              currentUserRole = userDocData.role || 'user';
            } else {
              currentUserRole = 'user';
              userDocData = null;
            }
          })
          .catch(function () {
            currentUserRole = 'user';
            userDocData = null;
          })
          .then(function () {
            authReady = true;
            authReadyCallbacks.forEach(function (cb) { cb(currentUser); });
            authReadyCallbacks = [];
          });
      } else {
        currentUserRole = null;
        userDocData = null;
        authReady = true;
        authReadyCallbacks.forEach(function (cb) { cb(null); });
        authReadyCallbacks = [];
      }
    });
  }

  function whenReady() {
    return new Promise(function (resolve) {
      if (authReady) { resolve(currentUser); return; }
      authReadyCallbacks.push(resolve);
    });
  }

  function fetchRole() {
    var user = firebase.auth().currentUser;
    if (!user) return Promise.resolve(null);
    return window.fireDb.collection('users').doc(user.uid).get()
      .then(function (doc) {
        if (doc.exists) {
          userDocData = doc.data();
          currentUserRole = userDocData.role || 'user';
        } else {
          currentUserRole = 'user';
          userDocData = null;
        }
        currentUser = user;
        return currentUserRole;
      });
  }

  function login(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }

  function register(email, password, displayName, phone) {
    return firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(function (cred) {
        return window.fireDb.collection('users').doc(cred.user.uid).set({
          email: email,
          phone: phone || '',
          role: 'user',
          displayName: displayName || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
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

  function getRole() {
    return currentUserRole;
  }

  function isAdmin() {
    return currentUserRole === 'admin';
  }

  function getUserDoc() {
    return userDocData;
  }

  function guardRoute(pageName) {
    if (protectedPages[pageName]) {
      if (!currentUser) return 'redirect-login';
      if (currentUserRole !== 'admin') return 'redirect-home';
      return 'allow';
    }
    if (userPages[pageName]) {
      if (!currentUser) return 'redirect-login';
      return 'allow';
    }
    if (authPages[pageName] && currentUser) {
      if (currentUserRole === 'admin') return 'redirect-admin';
      return 'redirect-dashboard';
    }
    return 'allow';
  }

  window.auth = {
    init: init,
    whenReady: whenReady,
    fetchRole: fetchRole,
    login: login,
    register: register,
    logout: logout,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    getRole: getRole,
    isAdmin: isAdmin,
    getUserDoc: getUserDoc,
    guardRoute: guardRoute
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
