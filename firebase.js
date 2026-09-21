// firebase.js
// ============================================================
// AURA SKILL - FIREBASE + MEDIAN ONESIGNAL
// Firebase Authentication
// Firestore
// Median Native OneSignal Bridge
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
    setDoc
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
// DEFAULT PROFILE PHOTO
// ============================================================

export const DEFAULT_PROFILE_PHOTO =
    "https://videotourl.com/images/1789800604014-b96e1edf-d789-4513-8557-9fb63a327a13.jpg";


// ============================================================
// ADMIN
// ============================================================

export const ADMIN_EMAIL =
    "teamgamechangerofficial@gmail.com";


// ============================================================
// ONESIGNAL
// ============================================================

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

export function waitForMedian(timeout = 7000) {

    return new Promise((resolve, reject) => {

        if (
            typeof window !== "undefined" &&
            window.median
        ) {
            resolve(window.median);
            return;
        }


        const started = Date.now();


        const timer = setInterval(() => {

            if (
                typeof window !== "undefined" &&
                window.median
            ) {

                clearInterval(timer);

                resolve(window.median);

                return;
            }


            if (
                Date.now() - started >= timeout
            ) {

                clearInterval(timer);

                reject(
                    new Error(
                        "MEDIAN_BRIDGE_TIMEOUT"
                    )
                );

            }

        }, 100);

    });

}


// ============================================================
// ONESIGNAL INFO
// ============================================================

export async function getOneSignalInfo() {

    try {

        const median =
            await waitForMedian(7000);


        if (
            !median.onesignal ||
            typeof median.onesignal.info !== "function"
        ) {

            throw new Error(
                "ONESIGNAL_BRIDGE_NOT_AVAILABLE"
            );

        }


        const info =
            await median.onesignal.info();


        return info || null;

    } catch (error) {

        console.warn(
            "OneSignal info warning:",
            error
        );

        return null;

    }

}


// ============================================================
// REGISTER / REQUEST NATIVE PUSH PERMISSION
// ============================================================

export async function registerOneSignal() {

    try {

        const median =
            await waitForMedian(7000);


        if (
            !median.onesignal ||
            typeof median.onesignal.register !== "function"
        ) {

            return {
                success: false,
                reason: "REGISTER_METHOD_NOT_AVAILABLE"
            };

        }


        const result =
            await median.onesignal.register();


        return result || {
            success: true
        };

    } catch (error) {

        console.warn(
            "OneSignal register warning:",
            error
        );

        return {
            success: false,
            error: error?.message || String(error)
        };

    }

}


// ============================================================
// LINK FIREBASE USER → ONESIGNAL EXTERNAL ID
// ============================================================

export async function linkOneSignalUser(userOrUid) {

    try {

        let firebaseUid = "";


        if (
            typeof userOrUid === "string"
        ) {

            firebaseUid =
                userOrUid.trim();

        } else if (
            userOrUid &&
            userOrUid.uid
        ) {

            firebaseUid =
                String(
                    userOrUid.uid
                ).trim();

        }


        if (!firebaseUid) {

            throw new Error(
                "FIREBASE_UID_MISSING"
            );

        }


        const median =
            await waitForMedian(7000);


        if (
            !median.onesignal ||
            typeof median.onesignal.login !== "function"
        ) {

            console.warn(
                "Median OneSignal login unavailable."
            );

            return {
                success: false,
                reason: "ONESIGNAL_LOGIN_NOT_AVAILABLE"
            };

        }


        // ====================================================
        // LOGIN / LINK USER
        // ====================================================

        const loginResult =
            await median.onesignal.login(
                firebaseUid
            );


        console.log(
            "OneSignal login result:",
            loginResult
        );


        // ====================================================
        // GET ONESIGNAL INFO
        // ====================================================

        let info = null;


        try {

            if (
                typeof median.onesignal.info ===
                "function"
            ) {

                info =
                    await median.onesignal.info();

            }

        } catch (infoError) {

            console.warn(
                "OneSignal info after login warning:",
                infoError
            );

        }


        // ====================================================
        // EXTRACT DATA
        // ====================================================

        const oneSignalId =
            info?.oneSignalId ||
            info?.onesignalId ||
            info?.userId ||
            null;


        const externalId =
            info?.externalId ||
            firebaseUid;


        const subscriptionId =
            info?.subscription?.id ||
            info?.subscriptionId ||
            null;


        const subscriptionToken =
            info?.subscription?.token ||
            info?.subscriptionToken ||
            null;


        const optedIn =
            info?.subscription?.optedIn ??
            null;


        const requiresPrivacyConsent =
            info?.requiresUserPrivacyConsent ??
            false;


        // ====================================================
        // SAVE TO FIRESTORE
        // ====================================================

        const userRef =
            doc(
                db,
                "users",
                firebaseUid
            );


        const oneSignalData = {

            oneSignalExternalId:
                externalId,

            oneSignalUserId:
                oneSignalId,

            oneSignalSubscriptionId:
                subscriptionId,

            oneSignalSubscriptionToken:
                subscriptionToken,

            oneSignalOptedIn:
                optedIn,

            oneSignalPrivacyConsentRequired:
                requiresPrivacyConsent,

            oneSignalLinked:
                true,

            oneSignalUpdatedAt:
                new Date().toISOString()

        };


        await setDoc(
            userRef,
            oneSignalData,
            {
                merge: true
            }
        );


        console.log(
            "OneSignal linked successfully:",
            oneSignalData
        );


        return {

            success: true,

            firebaseUid,

            oneSignalId,

            externalId,

            subscriptionId,

            subscriptionToken,

            optedIn,

            requiresPrivacyConsent

        };

    } catch (error) {

        console.warn(
            "OneSignal linking failed:",
            error
        );


        return {

            success: false,

            error:
                error?.message ||
                String(error)

        };

    }

}


// ============================================================
// ONE SIGNAL DEBUG INFO
// ============================================================

export async function getOneSignalDebugInfo() {

    const info =
        await getOneSignalInfo();


    if (!info) {

        return {

            available: false,

            oneSignalId: null,

            externalId: null,

            subscriptionId: null,

            subscriptionToken: null,

            optedIn: null

        };

    }


    return {

        available: true,

        oneSignalId:
            info?.oneSignalId ||
            info?.onesignalId ||
            info?.userId ||
            null,

        externalId:
            info?.externalId ||
            null,

        subscriptionId:
            info?.subscription?.id ||
            info?.subscriptionId ||
            null,

        subscriptionToken:
            info?.subscription?.token ||
            info?.subscriptionToken ||
            null,

        optedIn:
            info?.subscription?.optedIn ??
            null,

        requiresPrivacyConsent:
            info?.requiresUserPrivacyConsent ??
            false

    };

}


// ============================================================
// LOGOUT FROM ONESIGNAL
// ============================================================

export async function logoutOneSignalUser() {

    try {

        const median =
            await waitForMedian(5000);


        if (
            median.onesignal &&
            typeof median.onesignal.logout ===
            "function"
        ) {

            return await median.onesignal.logout();

        }

    } catch (error) {

        console.warn(
            "OneSignal logout warning:",
            error
        );

    }


    return null;

}


// ============================================================
// MEDIAN READY CALLBACK
// ============================================================

window.median_library_ready =
    function () {

        console.log(
            "✅ Median JavaScript Bridge ready"
        );

    };


// ============================================================
// FINAL
// ============================================================

console.log(
    "✅ AURA SKILL Firebase initialized"
);

console.log(
    "✅ Median OneSignal bridge integration loaded"
);
