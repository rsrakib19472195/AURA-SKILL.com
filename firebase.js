// firebase.js
// ============================================================
// AURA ARMAN TOUR - FIREBASE + MEDIAN ONESIGNAL
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
// CHECK MEDIAN APP
// ============================================================

export function isMedianApp() {

    return (
        typeof window !== "undefined" &&
        typeof window.median !== "undefined" &&
        typeof window.median.onesignal !== "undefined"
    );

}


// ============================================================
// WAIT FOR MEDIAN BRIDGE
// ============================================================

export function waitForMedian(
    timeout = 10000
) {

    return new Promise(resolve => {

        if (isMedianApp()) {

            resolve(true);

            return;

        }


        const started =
            Date.now();


        const timer =
            setInterval(() => {

                if (isMedianApp()) {

                    clearInterval(timer);

                    resolve(true);

                    return;

                }


                if (
                    Date.now() - started >=
                    timeout
                ) {

                    clearInterval(timer);

                    resolve(false);

                }

            }, 100);

    });

}


// ============================================================
// GET ONESIGNAL INFO
// ============================================================

export async function getOneSignalInfo() {

    const ready =
        await waitForMedian(10000);


    if (!ready) {

        return {

            success: false,

            available: false,

            error:
                "Median OneSignal bridge is not available."

        };

    }


    try {

        let info = null;


        /*
         * Current Median SDK supports:
         *
         * median.onesignal.info()
         *
         * Some versions expose:
         *
         * median.onesignal.onesignalInfo()
         */

        if (
            typeof window.median.onesignal.info ===
            "function"
        ) {

            info =
                await window.median.onesignal.info();

        }

        else if (
            typeof window.median.onesignal.onesignalInfo ===
            "function"
        ) {

            info =
                await window.median.onesignal.onesignalInfo();

        }


        if (!info) {

            return {

                success: false,

                available: true,

                error:
                    "OneSignal information is not available yet."

            };

        }


        return {

            success: true,

            available: true,

            ...info

        };

    } catch (error) {

        console.error(
            "OneSignal info error:",
            error
        );


        return {

            success: false,

            available: true,

            error:
                error.message ||
                "Unable to get OneSignal information."

        };

    }

}


// ============================================================
// REGISTER / REQUEST PUSH PERMISSION
// ============================================================

export async function registerOneSignal() {

    const ready =
        await waitForMedian(10000);


    if (!ready) {

        return {

            success: false,

            available: false,

            error:
                "Median app bridge not available."

        };

    }


    try {

        if (
            typeof window.median.onesignal.register !==
            "function"
        ) {

            return {

                success: false,

                available: true,

                error:
                    "OneSignal register method is unavailable."

            };

        }


        /*
         * This triggers the native Android/iOS
         * OneSignal permission prompt.
         */

        const result =
            await window.median.onesignal.register();


        /*
         * Give native SDK a little time to
         * update subscription state.
         */

        await new Promise(
            resolve =>
                setTimeout(resolve, 1200)
        );


        const info =
            await getOneSignalInfo();


        return {

            success:
                result?.success !== false,

            available: true,

            result,

            info

        };

    } catch (error) {

        console.error(
            "OneSignal register error:",
            error
        );


        return {

            success: false,

            available: true,

            error:
                error.message ||
                "Notification permission request failed."

        };

    }

}


// ============================================================
// LOGIN USER TO ONESIGNAL
// ============================================================

export async function linkOneSignalUser(
    userOrUid
) {

    const firebaseUid =
        typeof userOrUid === "string"
            ? userOrUid
            : userOrUid?.uid;


    if (!firebaseUid) {

        return {

            success: false,

            error:
                "Firebase UID is missing."

        };

    }


    const ready =
        await waitForMedian(10000);


    /*
     * Browser website:
     * Don't break normal Firebase login.
     */

    if (!ready) {

        return {

            success: false,

            available: false,

            skipped: true,

            error:
                "Median OneSignal bridge not available."

        };

    }


    try {

        /*
         * Firebase UID becomes OneSignal External ID.
         *
         * This is what the notification server
         * uses to target the exact user.
         */

        const result =
            await window.median.onesignal.login(
                firebaseUid
            );


        if (
            result &&
            result.success === false
        ) {

            return {

                success: false,

                available: true,

                error:
                    result.error ||
                    "OneSignal login failed.",

                result

            };

        }


        /*
         * Give OneSignal time to update identity.
         */

        await new Promise(
            resolve =>
                setTimeout(resolve, 500)
        );


        const info =
            await getOneSignalInfo();


        /*
         * Save useful OneSignal information
         * inside the user's Firestore document.
         */

        const subscription =
            info?.subscription || {};


        try {

            await setDoc(

                doc(
                    db,
                    "users",
                    firebaseUid
                ),

                {

                    oneSignal: {

                        appId:
                            ONESIGNAL_APP_ID,

                        oneSignalId:
                            info?.oneSignalId ||
                            null,

                        externalId:
                            info?.externalId ||
                            firebaseUid,

                        subscriptionId:
                            subscription?.id ||
                            null,

                        subscriptionToken:
                            subscription?.token ||
                            null,

                        optedIn:
                            subscription?.optedIn === true,

                        updatedAt:
                            new Date().toISOString()

                    }

                },

                {

                    merge: true

                }

            );

        } catch (firestoreError) {

            console.warn(
                "Could not save OneSignal info:",
                firestoreError
            );

        }


        return {

            success: true,

            available: true,

            firebaseUid,

            result,

            info

        };

    } catch (error) {

        console.error(
            "OneSignal login error:",
            error
        );


        return {

            success: false,

            available: true,

            error:
                error.message ||
                "OneSignal user linking failed."

        };

    }

}


// ============================================================
// LOGOUT ONESIGNAL
// ============================================================

export async function logoutOneSignalUser() {

    const ready =
        await waitForMedian(5000);


    if (!ready) {

        return {

            success: false,

            skipped: true

        };

    }


    try {

        if (
            typeof window.median.onesignal.logout ===
            "function"
        ) {

            const result =
                await window.median.onesignal.logout();


            return {

                success:
                    result?.success !== false,

                result

            };

        }


        return {

            success: false,

            error:
                "OneSignal logout is unavailable."

        };

    } catch (error) {

        console.error(
            "OneSignal logout error:",
            error
        );


        return {

            success: false,

            error:
                error.message

        };

    }

}


// ============================================================
// DEBUG INFORMATION
// ============================================================

export async function getOneSignalDebugInfo() {

    const medianAvailable =
        isMedianApp();


    if (!medianAvailable) {

        return {

            firebaseUid: auth.currentUser?.uid || "",

            externalId:
                "Not available",

            oneSignalId:
                "Not available",

            subscriptionId:
                "Not available",

            subscribed:
                "Not available",

            permission:
                "Not available",

            pushSupported:
                false,

            sdk:
                "WEB / NOT MEDIAN"

        };

    }


    const info =
        await getOneSignalInfo();


    const subscription =
        info?.subscription || {};


    return {

        firebaseUid:
            auth.currentUser?.uid || "",

        externalId:
            info?.externalId || "Not available",

        oneSignalId:
            info?.oneSignalId || "Not available",

        subscriptionId:
            subscription?.id || "Not available",

        subscriptionToken:
            subscription?.token || "Not available",

        subscribed:
            subscription?.optedIn === true,

        permission:
            subscription?.optedIn === true
                ? "Granted"
                : "Not granted",

        pushSupported:
            true,

        sdk:
            "MEDIAN NATIVE ONESIGNAL"

    };

}
