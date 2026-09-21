// firebase.js
// ============================================================
// AURA ARMAN TOUR
// FIREBASE + MEDIAN NATIVE ONESIGNAL
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
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
// MEDIAN DETECTION
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
    return new Promise((resolve) => {

        if (isMedianApp()) {
            resolve(true);
            return;
        }

        let finished = false;

        const finish = (value) => {
            if (finished) return;

            finished = true;

            try {
                window.removeEventListener(
                    "median_library_ready",
                    onReady
                );
            } catch (e) {}

            resolve(value);
        };

        const onReady = () => {
            finish(isMedianApp());
        };

        window.addEventListener(
            "median_library_ready",
            onReady,
            { once: true }
        );

        // Median documentation also supports this callback.
        window.median_library_ready = function () {
            finish(isMedianApp());
        };

        // If bridge was already injected.
        if (isMedianApp()) {
            finish(true);
            return;
        }

        setTimeout(() => {
            finish(isMedianApp());
        }, timeout);
    });
}


// ============================================================
// MEDIAN ONESIGNAL LOGIN
// Firebase UID -> OneSignal External ID
// ============================================================

export async function linkOneSignalUser(userOrUid) {

    const uid =
        typeof userOrUid === "string"
            ? userOrUid
            : userOrUid?.uid;

    if (!uid) {
        console.warn(
            "OneSignal: Firebase UID পাওয়া যায়নি."
        );

        return {
            success: false,
            reason: "firebase_uid_missing"
        };
    }

    const firebaseUid =
        String(uid).trim();

    if (!firebaseUid) {
        return {
            success: false,
            reason: "firebase_uid_empty"
        };
    }

    // --------------------------------------------------------
    // Browser হলে native Median OneSignal ব্যবহার করা যাবে না.
    // --------------------------------------------------------

    const medianReady =
        await waitForMedian(8000);

    if (!medianReady || !window.median?.onesignal) {

        console.warn(
            "OneSignal: Median native bridge unavailable."
        );

        return {
            success: false,
            reason: "median_bridge_unavailable",
            firebaseUid
        };
    }


    try {

        console.log(
            "======================================"
        );

        console.log(
            "AURA OneSignal linking started"
        );

        console.log(
            "Firebase UID:",
            firebaseUid
        );


        // ----------------------------------------------------
        // IMPORTANT
        // Median native OneSignal login
        // ----------------------------------------------------

        const loginResult =
            await window.median.onesignal.login(
                firebaseUid
            );

        console.log(
            "Median OneSignal login result:",
            loginResult
        );


        // ----------------------------------------------------
        // Get OneSignal information
        // ----------------------------------------------------

        let info = null;

        try {

            info =
                await window.median.onesignal.info();

        } catch (infoError) {

            console.warn(
                "onesignal.info() failed:",
                infoError
            );

            // Some Median versions expose onesignalInfo().
            if (
                typeof window.median.onesignal.onesignalInfo ===
                "function"
            ) {
                info =
                    await window.median.onesignal.onesignalInfo();
            }
        }


        info = info || {};


        const oneSignalId =
            info.oneSignalId ||
            info.onesignalId ||
            info.oneSignalUserId ||
            null;

        const externalId =
            info.externalId ||
            info.external_id ||
            firebaseUid;

        const subscription =
            info.subscription || {};

        const subscriptionId =
            subscription.id ||
            info.subscriptionId ||
            null;

        const subscriptionToken =
            subscription.token ||
            null;

        const optedIn =
            subscription.optedIn ??
            null;


        const result = {

            success:
                loginResult?.success !== false,

            firebaseUid,

            externalId,

            oneSignalId,

            subscriptionId,

            subscriptionToken,

            optedIn,

            requiresUserPrivacyConsent:
                info.requiresUserPrivacyConsent ??
                null,

            raw:
                info
        };


        console.log(
            "======================================"
        );

        console.log(
            "AURA ONESIGNAL RESULT"
        );

        console.log(
            "Firebase UID:",
            firebaseUid
        );

        console.log(
            "External ID:",
            externalId
        );

        console.log(
            "OneSignal User ID:",
            oneSignalId
        );

        console.log(
            "Subscription ID:",
            subscriptionId
        );

        console.log(
            "Subscribed:",
            optedIn
        );

        console.log(
            "======================================"
        );


        // ----------------------------------------------------
        // Save identifiers in Firestore
        // users/{firebaseUid}
        // ----------------------------------------------------

        try {

            await setDoc(
                doc(db, "users", firebaseUid),
                {
                    oneSignal: {
                        externalId:
                            externalId || firebaseUid,

                        oneSignalId:
                            oneSignalId || null,

                        subscriptionId:
                            subscriptionId || null,

                        subscriptionToken:
                            subscriptionToken || null,

                        optedIn:
                            optedIn,

                        requiresUserPrivacyConsent:
                            info.requiresUserPrivacyConsent ??
                            null,

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
                "OneSignal info Firestore save failed:",
                firestoreError
            );

            // Linking itself may still be successful.
        }


        return result;


    } catch (error) {

        console.error(
            "OneSignal linking failed:",
            error
        );

        return {

            success: false,

            reason:
                "onesignal_login_failed",

            firebaseUid,

            error:
                error?.message ||
                String(error)
        };
    }
}


// ============================================================
// GET ONESIGNAL INFO
// ============================================================

export async function getOneSignalInfo() {

    try {

        const ready =
            await waitForMedian(5000);

        if (
            !ready ||
            !window.median?.onesignal
        ) {
            return null;
        }


        if (
            typeof window.median.onesignal.info ===
            "function"
        ) {

            return await
                window.median.onesignal.info();
        }


        if (
            typeof window.median.onesignal.onesignalInfo ===
            "function"
        ) {

            return await
                window.median.onesignal.onesignalInfo();
        }


        return null;


    } catch (error) {

        console.warn(
            "getOneSignalInfo failed:",
            error
        );

        return null;
    }
}


// ============================================================
// ONE SIGNAL DEBUG INFO
// ============================================================

export async function getOneSignalDebugInfo() {

    const firebaseUid =
        auth.currentUser?.uid || null;


    const result = {

        firebaseUid,

        externalId: null,

        oneSignalId: null,

        subscriptionId: null,

        subscriptionToken: null,

        optedIn: null,

        requiresUserPrivacyConsent: null,

        sdk: "MEDIAN",

        nativeBridge: false
    };


    try {

        const ready =
            await waitForMedian(5000);

        if (
            !ready ||
            !window.median?.onesignal
        ) {

            result.sdk =
                "MEDIAN BRIDGE NOT AVAILABLE";

            return result;
        }


        result.nativeBridge = true;


        const info =
            await getOneSignalInfo();


        if (!info) {

            result.sdk =
                "MEDIAN ONESIGNAL AVAILABLE";

            return result;
        }


        result.externalId =
            info.externalId ||
            info.external_id ||
            null;

        result.oneSignalId =
            info.oneSignalId ||
            info.onesignalId ||
            info.oneSignalUserId ||
            null;


        result.subscriptionId =
            info.subscription?.id ||
            info.subscriptionId ||
            null;


        result.subscriptionToken =
            info.subscription?.token ||
            null;


        result.optedIn =
            info.subscription?.optedIn ??
            null;


        result.requiresUserPrivacyConsent =
            info.requiresUserPrivacyConsent ??
            null;


        result.sdk =
            "MEDIAN ONESIGNAL V5+";


        return result;


    } catch (error) {

        result.sdk =
            "MEDIAN ONESIGNAL ERROR";

        result.error =
            error?.message ||
            String(error);

        return result;
    }
}


// ============================================================
// LOGOUT
// ============================================================

export async function logoutOneSignalUser() {

    try {

        const ready =
            await waitForMedian(5000);

        if (
            !ready ||
            !window.median?.onesignal
        ) {
            return false;
        }


        if (
            typeof window.median.onesignal.logout ===
            "function"
        ) {

            const result =
                await window.median.onesignal.logout();

            console.log(
                "OneSignal logout:",
                result
            );

            return true;
        }


        return false;


    } catch (error) {

        console.warn(
            "OneSignal logout failed:",
            error
        );

        return false;
    }
}
