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
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyA2wYMZAMx6p2GRC21KGgsHgiCoVz--81A",

    authDomain:
        "aura-arman-tour.firebaseapp.com",

    databaseURL:
        "https://aura-arman-tour-default-rtdb.firebaseio.com",

    projectId:
        "aura-arman-tour",

    storageBucket:
        "aura-arman-tour.firebasestorage.app",

    messagingSenderId:
        "502326798792",

    appId:
        "1:502326798792:web:2afd27cb9cd44da48cb8fd"

};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app =
    initializeApp(firebaseConfig);


export const auth =
    getAuth(app);


export const db =
    getFirestore(app);


/* =========================================================
   GENERAL APP DATA
========================================================= */

export const DEFAULT_PROFILE_PHOTO =
    "https://videotourl.com/images/1789800604014-b96e1edf-d789-4513-8557-9fb63a327a13.jpg";


export const ADMIN_EMAIL =
    "teamgamechangerofficial@gmail.com";


/* =========================================================
   ONESIGNAL
========================================================= */

export const ONESIGNAL_APP_ID =
    "b4420740-b9f6-4de7-8792-f6302ad38e4d";


/* =========================================================
   CHECK MEDIAN APP
========================================================= */

export function isMedianApp() {

    return (
        typeof window !== "undefined" &&
        typeof window.median !== "undefined"
    );

}


/* =========================================================
   WAIT FOR MEDIAN BRIDGE
========================================================= */

export function waitForMedian(
    timeout = 10000
) {

    return new Promise(
        (resolve, reject) => {

            if (
                typeof window !== "undefined" &&
                window.median
            ) {

                resolve(
                    window.median
                );

                return;

            }


            const start =
                Date.now();


            const timer =
                setInterval(() => {

                    if (
                        typeof window !== "undefined" &&
                        window.median
                    ) {

                        clearInterval(timer);

                        resolve(
                            window.median
                        );

                        return;

                    }


                    if (
                        Date.now() - start >=
                        timeout
                    ) {

                        clearInterval(timer);

                        reject(
                            new Error(
                                "MEDIAN_BRIDGE_TIMEOUT"
                            )
                        );

                    }

                }, 100);

        }
    );

}


/* =========================================================
   GET ONESIGNAL INFO
========================================================= */

export async function getOneSignalInfo() {

    const median =
        await waitForMedian();


    if (
        !median.onesignal
    ) {

        throw new Error(
            "ONESIGNAL_BRIDGE_UNAVAILABLE"
        );

    }


    /*
     * Current Median SDK
     */

    if (
        typeof median.onesignal.info ===
        "function"
    ) {

        return await median.onesignal.info();

    }


    /*
     * Compatibility fallback
     */

    if (
        typeof median.onesignal.onesignalInfo ===
        "function"
    ) {

        return await median.onesignal.onesignalInfo();

    }


    throw new Error(
        "ONESIGNAL_INFO_UNAVAILABLE"
    );

}


/* =========================================================
   REGISTER / REQUEST PUSH
========================================================= */

export async function registerOneSignal() {

    const median =
        await waitForMedian();


    if (
        !median.onesignal
    ) {

        throw new Error(
            "ONESIGNAL_BRIDGE_UNAVAILABLE"
        );

    }


    if (
        typeof median.onesignal.register !==
        "function"
    ) {

        /*
         * Auto-register mode normally handles
         * the native permission prompt.
         */

        try {

            return await getOneSignalInfo();

        } catch (error) {

            throw new Error(
                "ONESIGNAL_REGISTER_UNAVAILABLE"
            );

        }

    }


    return await median.onesignal.register();

}


/* =========================================================
   LINK FIREBASE USER TO ONESIGNAL
========================================================= */

export async function linkOneSignalUser(
    userOrUid
) {

    const uid =
        typeof userOrUid === "string"
            ? userOrUid
            : userOrUid?.uid;


    if (!uid) {

        throw new Error(
            "FIREBASE_UID_REQUIRED"
        );

    }


    /*
     * Browser হলে OneSignal native bridge নেই।
     */

    if (!isMedianApp()) {

        return {

            success: false,

            inMedian: false,

            reason:
                "NOT_RUNNING_IN_MEDIAN_APP"

        };

    }


    const median =
        await waitForMedian();


    if (
        !median.onesignal ||
        typeof median.onesignal.login !==
        "function"
    ) {

        throw new Error(
            "ONESIGNAL_LOGIN_UNAVAILABLE"
        );

    }


    /* =====================================================
       LINK FIREBASE UID -> ONESIGNAL EXTERNAL ID
    ===================================================== */

    const loginResult =
        await median.onesignal.login(
            uid
        );


    /*
     * Read OneSignal information
     */

    let info = null;


    try {

        info =
            await getOneSignalInfo();

    } catch (error) {

        console.warn(
            "OneSignal info unavailable:",
            error
        );

    }


    /* =====================================================
       SAVE ONESIGNAL DATA TO FIRESTORE
    ===================================================== */

    if (info) {

        try {

            await setDoc(

                doc(
                    db,
                    "users",
                    uid
                ),

                {

                    oneSignal: {

                        appId:
                            ONESIGNAL_APP_ID,

                        oneSignalId:
                            info.oneSignalId ||
                            null,

                        externalId:
                            info.externalId ||
                            uid,

                        subscriptionId:
                            info.subscription?.id ||
                            null,

                        optedIn:
                            info.subscription?.optedIn === true,

                        requiresUserPrivacyConsent:
                            info.requiresUserPrivacyConsent === true,

                        updatedAt:
                            serverTimestamp()

                    }

                },

                {
                    merge: true
                }

            );

        } catch (firestoreError) {

            /*
             * Notification sync failure should NOT
             * cancel successful registration.
             */

            console.warn(
                "Could not save OneSignal info:",
                firestoreError
            );

        }

    } else {

        /*
         * At minimum save External ID.
         */

        try {

            await setDoc(

                doc(
                    db,
                    "users",
                    uid
                ),

                {

                    oneSignal: {

                        appId:
                            ONESIGNAL_APP_ID,

                        externalId:
                            uid,

                        updatedAt:
                            serverTimestamp()

                    }

                },

                {
                    merge: true
                }

            );

        } catch (error) {

            console.warn(
                "Could not save OneSignal external ID:",
                error
            );

        }

    }


    return {

        success:
            loginResult?.success !== false,

        uid:
            uid,

        loginResult:
            loginResult,

        info:
            info

    };

}


/* =========================================================
   SYNC ONESIGNAL AFTER REGISTRATION
========================================================= */

export async function syncRegisteredUserToOneSignal(
    firebaseUser
) {

    if (
        !firebaseUser?.uid
    ) {

        throw new Error(
            "FIREBASE_USER_REQUIRED"
        );

    }


    if (!isMedianApp()) {

        return {

            success: false,

            inMedian: false,

            subscribed: false

        };

    }


    /*
     * First link Firebase UID with OneSignal
     */

    const linked =
        await linkOneSignalUser(
            firebaseUser
        );


    /*
     * Get latest subscription state
     */

    let info =
        linked.info;


    try {

        info =
            await getOneSignalInfo();

    } catch (error) {

        console.warn(
            "Could not refresh OneSignal info:",
            error
        );

    }


    /*
     * If permission is not active yet,
     * try native register as a fallback.
     *
     * Auto-register ON থাকলেও এটা safe fallback।
     */

    if (
        info &&
        info.subscription &&
        info.subscription.optedIn !== true
    ) {

        try {

            await registerOneSignal();

        } catch (error) {

            console.warn(
                "OneSignal register fallback:",
                error
            );

        }


        /*
         * Give native SDK a moment to update.
         */

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    700
                )
        );


        try {

            info =
                await getOneSignalInfo();

        } catch (error) {

            console.warn(
                "Final OneSignal info failed:",
                error
            );

        }

    }


    /*
     * Save final status
     */

    if (info) {

        try {

            await setDoc(

                doc(
                    db,
                    "users",
                    firebaseUser.uid
                ),

                {

                    oneSignal: {

                        appId:
                            ONESIGNAL_APP_ID,

                        oneSignalId:
                            info.oneSignalId ||
                            null,

                        externalId:
                            info.externalId ||
                            firebaseUser.uid,

                        subscriptionId:
                            info.subscription?.id ||
                            null,

                        optedIn:
                            info.subscription?.optedIn === true,

                        requiresUserPrivacyConsent:
                            info.requiresUserPrivacyConsent === true,

                        updatedAt:
                            serverTimestamp()

                    }

                },

                {
                    merge: true
                }

            );

        } catch (error) {

            console.warn(
                "Final OneSignal Firestore sync failed:",
                error
            );

        }

    }


    return {

        success: true,

        uid:
            firebaseUser.uid,

        subscribed:
            info?.subscription?.optedIn === true,

        oneSignalId:
            info?.oneSignalId ||
            null,

        externalId:
            info?.externalId ||
            firebaseUser.uid,

        subscriptionId:
            info?.subscription?.id ||
            null

    };

}


/* =========================================================
   LOGOUT
========================================================= */

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
            "OneSignal logout:",
            error
        );

    }


    return null;

}


/* =========================================================
   DEBUG INFO
========================================================= */

export async function getOneSignalDebugInfo() {

    if (!isMedianApp()) {

        return {

            inMedian:
                false,

            subscribed:
                false

        };

    }


    try {

        const info =
            await getOneSignalInfo();


        return {

            inMedian:
                true,

            oneSignalId:
                info?.oneSignalId ||
                null,

            externalId:
                info?.externalId ||
                null,

            subscriptionId:
                info?.subscription?.id ||
                null,

            subscribed:
                info?.subscription?.optedIn === true

        };

    } catch (error) {

        return {

            inMedian:
                true,

            subscribed:
                false,

            error:
                error.message

        };

    }

}
