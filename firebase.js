// firebase.js
// ============================================================
// AURA SKILL / AURA ARMAN TOUR
// Firebase + Median Native OneSignal
// Auto-register mode supported
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
// APP CONSTANTS
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
        typeof window.median !== "undefined"
    );
}


// ============================================================
// WAIT FOR MEDIAN BRIDGE
// ============================================================

export function waitForMedian(timeout = 10000) {

    return new Promise((resolve, reject) => {

        if (isMedianApp()) {
            resolve(window.median);
            return;
        }

        const started = Date.now();

        const timer = setInterval(() => {

            if (isMedianApp()) {

                clearInterval(timer);
                resolve(window.median);
                return;
            }

            if (Date.now() - started >= timeout) {

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

    if (
        !median.onesignal
    ) {
        throw new Error(
            "ONESIGNAL_BRIDGE_UNAVAILABLE"
        );
    }


    // Modern Median method
    if (
        typeof median.onesignal.info === "function"
    ) {

        return await median.onesignal.info();
    }


    // Compatibility fallback
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
// REGISTER / NATIVE PERMISSION
//
// Auto-register ON থাকলে সাধারণত Median নিজেই permission prompt
// দেখাবে। এই function শুধু available থাকলে manually trigger করবে.
// ============================================================

export async function registerOneSignal() {

    const median = await waitForMedian();

    if (
        !median.onesignal
    ) {
        throw new Error(
            "ONESIGNAL_BRIDGE_UNAVAILABLE"
        );
    }


    if (
        typeof median.onesignal.register === "function"
    ) {

        return await median.onesignal.register();
    }


    // Auto-register mode-এ register method unavailable হলেও
    // app নিজে permission handle করতে পারে।
    return {
        success: true,
        automatic: true
    };
}


// ============================================================
// LINK FIREBASE USER → ONESIGNAL USER
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


    // Browser হলে native OneSignal call করব না
    if (!isMedianApp()) {

        return {
            success: false,
            skipped: true,
            reason: "NOT_MEDIAN_APP"
        };
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
    // Firebase UID → OneSignal External ID
    // --------------------------------------------------------

    const loginResult =
        await median.onesignal.login(uid);


    // --------------------------------------------------------
    // Get current OneSignal information
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
    // Save useful OneSignal data to Firestore
    // --------------------------------------------------------

    if (info) {

        try {

            await setDoc(
                doc(db, "users", uid),
                {
                    oneSignal: {

                        appId: ONESIGNAL_APP_ID,

                        oneSignalId:
                            info.oneSignalId || null,

                        externalId:
                            info.externalId || uid,

                        subscriptionId:
                            info.subscription?.id || null,

                        optedIn:
                            info.subscription?.optedIn === true,

                        updatedAt:
                            serverTimestamp()
                    }
                },
                {
                    merge: true
                }
            );

        } catch (firestoreError) {

            // Firestore save fail হলেও login বন্ধ হবে না
            console.warn(
                "OneSignal Firestore save failed:",
                firestoreError
            );
        }

    } else {

        try {

            await setDoc(
                doc(db, "users", uid),
                {
                    oneSignal: {

                        appId: ONESIGNAL_APP_ID,

                        externalId: uid,

                        updatedAt:
                            serverTimestamp()
                    }
                },
                {
                    merge: true
                }
            );

        } catch (firestoreError) {

            console.warn(
                "OneSignal basic Firestore save failed:",
                firestoreError
            );
        }
    }


    return {
        success:
            loginResult?.success !== false,

        result:
            loginResult,

        info
    };
}


// ============================================================
// LOGOUT FROM ONESIGNAL
// অন্য page-এর logout-এর সময় চাইলে এটা call করবে
// ============================================================

export async function logoutOneSignalUser() {

    if (!isMedianApp()) {
        return null;
    }


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
// DEBUG INFO
// ============================================================

export async function getOneSignalDebugInfo() {

    if (!isMedianApp()) {

        return {

            inMedian: false,

            message:
                "This page is running in a normal browser."
        };
    }


    try {

        const info =
            await getOneSignalInfo();


        return {

            inMedian: true,

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

            error:
                error?.message || "Unknown error"
        };
    }
}


// ============================================================
// GLOBAL DEBUG HELPER
// Browser console থেকেও check করা যাবে:
//
// AURA_ONESIGNAL.info()
// AURA_ONESIGNAL.debug()
// ============================================================

if (typeof window !== "undefined") {

    window.AURA_ONESIGNAL = {

        info: getOneSignalInfo,

        debug: getOneSignalDebugInfo,

        register: registerOneSignal,

        link: linkOneSignalUser,

        logout: logoutOneSignalUser
    };
}
