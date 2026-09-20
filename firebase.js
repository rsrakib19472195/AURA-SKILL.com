// firebase.js
// ============================================================
// AURA / AURA SKILL - FIREBASE CONFIG
// Firestore + Firebase Authentication
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2wYMZAMx6p2GRC21KGgsHgiCoVz--81A",
  authDomain: "aura-arman-tour.firebaseapp.com",
  databaseURL: "https://aura-arman-tour-default-rtdb.firebaseio.com",
  projectId: "aura-arman-tour",
  storageBucket: "aura-arman-tour.firebasestorage.app",
  messagingSenderId: "502326798792",
  appId: "1:502326798792:web:2afd27cb9cd44da48cb8fd"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Default profile picture
export const DEFAULT_PROFILE_PHOTO =
    "https://videotourl.com/images/1789800604014-b96e1edf-d789-4513-8557-9fb63a327a13.jpg";

// Admin information
export const ADMIN_EMAIL = "teamgamechangerofficial@gmail.com";
