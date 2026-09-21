// firebase.js
// ============================================================
// AURA SKILL / AURA ARMAN TOUR
// Firebase + Median Native OneSignal
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyA2wYMZAMx6p2GRC21KGgsHgiCoVz--81A",
    authDomain: "aura-arman-tour.firebaseapp.com",
    databaseURL: "https://aura-arman-tour-default-rtdb.firebaseio.com",
    projectId: "aura-arman-tour",
    storageBucket: "aura-arman-tour.firebasestorage.app",
    messagingSenderId: "502326798792",
    appId: "1:502326798792:web:2afd27cb9cd44da48cb8fd"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


// ============================================================
// AURA SETTINGS
// ============================================================

export const DEFAULT_PROFILE_PHOTO =
    "https://videotourl.com/images/1789800604014-b96e1edf-d789-4513-8557-9fb63a327a13.jpg";

export const ADMIN_EMAIL =
    "teamgamechangerofficial@gmail.com";

export const ONESIGNAL_APP_ID =
    "b4420740-b9f6-4de7-8792-f6302ad38e4d";


// ============================================================
// MEDIAN APP CHECK
// ============================================================

export function isMedianApp() {
    return (
        typeof window !== "undefined" &&
        !!window.median
    );
}


// ============================================================
// WAIT FOR MEDIAN JAVASCRIPT BRIDGE
// ============================================================

export function waitForMedian(timeout = 10000) {

    return new Promise((resolve, reject) => {

        if (
            typeof window !== "undefined" &&
            window.median
        ) {
            resolve(window.median);
            return;
        }

        const startedAt = Date.now();

        const timer = setInterval(() => {

            if (
                typeof window !== "undefined" &&
                window.median
            ) {
                clearInterval(timer);
                resolve(window.median);
                return;
            }

            if (Date.now() - startedAt >= timeout) {
                clearInterval(timer);
                reject(
                    new Error("MEDIAN_BRIDGE_TIMEOUT")
                );
            }

        }, 100);

    });

}


// ============================================================
// GET ONESIGNAL INFO
// ============================================================

export async function getOneSignalInfo() {

    const median = await waitForMedian();

    if (!median.onesignal) {
        throw new Error(
            "ONESIGNAL_BRIDGE_UNAVAILABLE"
        );
    }

    // Current Median bridge
    if (
        typeof median.onesignal.info === "function"
    ) {
        return await median.onesignal.info();
    }

    // Legacy compatibility
    if (
        typeof median.onesignal.onesignalInfo === "function"
    ) {
        return await median.onesignal.onesignalInfo();
    }

    throw new Error(
        "ONESIGNAL_INFO_UNAVAILABLE"
    );

}


// ============================================================
// LINK FIREBASE USER WITH ONESIGNAL
// ============================================================

export async function linkOneSignalUser(userOrUid) {

    const uid =
        typeof userOrUid === "string"
            ? userOrUid
            : userOrUid?.uid;

    if (!uid) {
        throw new Error(
            "FIREBASE_UID_REQUIRED"
        );
    }

    const median = await waitForMedian();

    if (
        !median.onesignal ||
        typeof median.onesignal.login !== "function"
    ) {
        throw new Error(
            "ONESIGNAL_LOGIN_UNAVAILABLE"
        );
    }


    // --------------------------------------------------------
    // Firebase UID -> OneSignal External ID
    // --------------------------------------------------------

    const loginResult =
        await median.onesignal.login(uid);


    // --------------------------------------------------------
    // Read current OneSignal information
    // --------------------------------------------------------

    let info = null;

    try {
        info = await getOneSignalInfo();
    } catch (error) {
        console.warn(
            "OneSignal info unavailable:",
            error
        );
    }


    // --------------------------------------------------------
    // Save useful OneSignal information to Firestore
    // --------------------------------------------------------

    try {

        const oneSignalData = {

            appId: ONESIGNAL_APP_ID,

            oneSignalId:
                info?.oneSignalId || null,

            externalId:
                info?.externalId || uid,

            subscriptionId:
                info?.subscription?.id || null,

            optedIn:
                info?.subscription?.optedIn === true,

            updatedAt:
                serverTimestamp()

        };


        await setDoc(
            doc(db, "users", uid),
            {
                oneSignal: oneSignalData
            },
            {
                merge: true
            }
        );


    } catch (firestoreError) {

        // OneSignal linking should never stop Firebase login.
        console.warn(
            "OneSignal Firestore sync failed:",
            firestoreError
        );

    }


    return {
        loginResult,
        info
    };

}


// ============================================================
// LOGOUT ONESIGNAL USER
// ============================================================

export async function logoutOneSignalUser() {

    try {

        const median =
            await waitForMedian(5000);

        if (
            median.onesignal &&
            typeof median.onesignal.logout === "function"
        ) {
            return await median.onesignal.logout();
        }

    } catch (error) {

        console.warn(
            "OneSignal logout skipped:",
            error
        );

    }

    return null;

}


// ============================================================
// DEBUG INFORMATION
// ============================================================

export async function getOneSignalDebugInfo() {

    if (!isMedianApp()) {

        return {
            inMedian: false,
            message: "Running in normal browser"
        };

    }


    try {

        const info =
            await getOneSignalInfo();

        return {

            inMedian: true,

            sdk:
                "Median Native OneSignal",

            appId:
                ONESIGNAL_APP_ID,

            oneSignalId:
                info?.oneSignalId || null,

            externalId:
                info?.externalId || null,

            subscriptionId:
                info?.subscription?.id || null,

            optedIn:
                info?.subscription?.optedIn === true

        };

    } catch (error) {

        return {

            inMedian: true,

            sdk:
                "Median Native OneSignal",

            appId:
                ONESIGNAL_APP_ID,

            error:
                error?.message || String(error)

        };

    }

}


// ============================================================
// GLOBAL AURA ONESIGNAL HELPER
// ============================================================

if (typeof window !== "undefined") {

    window.AURA_ONESIGNAL = {

        isMedianApp,

        getInfo:
            getOneSignalInfo,

        linkUser:
            linkOneSignalUser,

        logout:
            logoutOneSignalUser,

        debug:
            getOneSignalDebugInfo

    };

}
