// firebase.js
// ============================================================
// AURA / AURA SKILL - FIREBASE CONFIG
// Firebase + OneSignal User Linking
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
// ONESIGNAL
// ============================================================

export const ONESIGNAL_APP_ID =
    "b4420740-b9f6-4de7-8792-f6302ad38e4d";


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
// ONESIGNAL STATE
// ============================================================

let oneSignalReadyPromise = null;

let oneSignalInstance = null;


// ============================================================
// TIMEOUT HELPER
// ============================================================

function withTimeout(
    promise,
    timeout = 7000
) {

    return Promise.race([

        promise,

        new Promise((_, reject) => {

            setTimeout(() => {

                reject(
                    new Error(
                        "OneSignal operation timeout."
                    )
                );

            }, timeout);

        })

    ]);

}


// ============================================================
// INITIALIZE ONESIGNAL
// ============================================================

export function initOneSignal() {

    if (oneSignalReadyPromise) {
        return oneSignalReadyPromise;
    }


    oneSignalReadyPromise =
        new Promise((resolve, reject) => {

            try {

                /*
                 * Create OneSignal deferred queue
                 */

                window.OneSignalDeferred =
                    window.OneSignalDeferred || [];


                /*
                 * If OneSignal SDK is already loaded
                 */

                if (window.OneSignal) {

                    (async () => {

                        try {

                            await withTimeout(
                                window.OneSignal.init({
                                    appId:
                                        ONESIGNAL_APP_ID
                                }),
                                7000
                            );


                            oneSignalInstance =
                                window.OneSignal;


                            console.log(
                                "✅ OneSignal initialized"
                            );


                            resolve(
                                oneSignalInstance
                            );

                        } catch (error) {

                            console.error(
                                "❌ OneSignal initialization failed:",
                                error
                            );

                            reject(error);
                        }

                    })();

                    return;
                }


                /*
                 * Check if SDK script already exists
                 */

                const existingScript =
                    document.querySelector(
                        'script[src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"]'
                    );


                if (existingScript) {

                    window.OneSignalDeferred.push(
                        async function (OneSignal) {

                            try {

                                await withTimeout(
                                    OneSignal.init({
                                        appId:
                                            ONESIGNAL_APP_ID
                                    }),
                                    7000
                                );


                                oneSignalInstance =
                                    OneSignal;


                                console.log(
                                    "✅ OneSignal initialized"
                                );


                                resolve(
                                    oneSignalInstance
                                );

                            } catch (error) {

                                console.error(
                                    "❌ OneSignal initialization failed:",
                                    error
                                );

                                reject(error);
                            }

                        }
                    );

                    return;
                }


                /*
                 * Load SDK
                 */

                const script =
                    document.createElement("script");


                script.src =
                    "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";


                script.defer = true;


                script.onload = function () {

                    window.OneSignalDeferred.push(
                        async function (OneSignal) {

                            try {

                                await withTimeout(
                                    OneSignal.init({
                                        appId:
                                            ONESIGNAL_APP_ID
                                    }),
                                    7000
                                );


                                oneSignalInstance =
                                    OneSignal;


                                console.log(
                                    "✅ OneSignal initialized"
                                );


                                resolve(
                                    oneSignalInstance
                                );

                            } catch (error) {

                                console.error(
                                    "❌ OneSignal initialization failed:",
                                    error
                                );

                                reject(error);
                            }

                        }
                    );

                };


                script.onerror = function () {

                    const error =
                        new Error(
                            "OneSignal SDK could not be loaded."
                        );


                    console.error(
                        "❌",
                        error
                    );


                    reject(error);

                };


                document.head.appendChild(
                    script
                );

            } catch (error) {

                console.error(
                    "❌ OneSignal setup error:",
                    error
                );


                reject(error);

            }

        });


    return oneSignalReadyPromise;
}


// ============================================================
// PRELOAD ONESIGNAL
// ============================================================

export function preloadOneSignal() {

    /*
     * IMPORTANT:
     * This never blocks the page.
     */

    initOneSignal()
        .then(() => {

            console.log(
                "✅ OneSignal preloaded"
            );

        })
        .catch(error => {

            console.warn(
                "⚠️ OneSignal preload failed:",
                error
            );

        });

}


// ============================================================
// LINK FIREBASE USER → ONESIGNAL EXTERNAL ID
// ============================================================

export async function linkOneSignalUser(
    user
) {

    if (
        !user ||
        !user.uid
    ) {

        console.warn(
            "⚠️ Firebase user not available."
        );

        return false;
    }


    try {

        /*
         * Never wait forever.
         */

        const OneSignal =
            oneSignalInstance ||
            await withTimeout(
                initOneSignal(),
                7000
            );


        if (!OneSignal) {

            console.warn(
                "⚠️ OneSignal is not available."
            );

            return false;
        }


        /*
         * Firebase UID becomes
         * OneSignal External ID.
         */

        const externalId =
            String(user.uid);


        await withTimeout(
            OneSignal.login(
                externalId
            ),
            7000
        );


        console.log(
            "================================"
        );

        console.log(
            "✅ OneSignal user linked"
        );

        console.log(
            "Firebase UID:",
            externalId
        );

        console.log(
            "OneSignal External ID:",
            externalId
        );

        console.log(
            "================================"
        );


        return true;


    } catch (error) {

        console.warn(
            "⚠️ OneSignal user linking failed:",
            error
        );


        /*
         * IMPORTANT:
         * Firebase login should continue
         * even if OneSignal fails.
         */

        return false;
    }

}


// ============================================================
// REQUEST NOTIFICATION PERMISSION
// ============================================================

export async function requestOneSignalPermission() {

    try {

        const OneSignal =
            oneSignalInstance ||
            await withTimeout(
                initOneSignal(),
                7000
            );


        if (!OneSignal) {
            return false;
        }


        await withTimeout(

            OneSignal.Notifications
                .requestPermission(),

            7000

        );


        console.log(
            "✅ Notification permission requested"
        );


        return true;


    } catch (error) {

        console.warn(
            "⚠️ Notification permission request failed:",
            error
        );


        return false;
    }

}


// ============================================================
// GET NOTIFICATION PERMISSION
// ============================================================

export async function getOneSignalPermissionStatus() {

    try {

        const OneSignal =
            oneSignalInstance ||
            await withTimeout(
                initOneSignal(),
                7000
            );


        if (!OneSignal) {
            return false;
        }


        return (
            OneSignal.Notifications.permission
        );


    } catch (error) {

        console.warn(
            "⚠️ Could not get notification status:",
            error
        );


        return false;
    }

}


// ============================================================
// GET ONESIGNAL SUBSCRIPTION ID
// ============================================================

export async function getOneSignalSubscriptionId() {

    try {

        const OneSignal =
            oneSignalInstance ||
            await withTimeout(
                initOneSignal(),
                7000
            );


        if (!OneSignal) {
            return null;
        }


        /*
         * OneSignal Web SDK v16
         */

        const subscriptionId =
            OneSignal.User
                ?.PushSubscription
                ?.id || null;


        console.log(
            "OneSignal Subscription ID:",
            subscriptionId
        );


        return subscriptionId;


    } catch (error) {

        console.warn(
            "⚠️ Could not get subscription ID:",
            error
        );


        return null;
    }

}


// ============================================================
// GET ONESIGNAL EXTERNAL ID
// ============================================================

export async function getOneSignalExternalId() {

    try {

        const OneSignal =
            oneSignalInstance ||
            await withTimeout(
                initOneSignal(),
                7000
            );


        if (!OneSignal) {
            return null;
        }


        const externalId =
            OneSignal.User?.externalId ||
            null;


        console.log(
            "OneSignal External ID:",
            externalId
        );


        return externalId;


    } catch (error) {

        console.warn(
            "⚠️ Could not get External ID:",
            error
        );


        return null;
    }

}


// ============================================================
// LOGOUT ONESIGNAL USER
// ============================================================

export async function logoutOneSignalUser() {

    try {

        const OneSignal =
            oneSignalInstance ||
            await withTimeout(
                initOneSignal(),
                7000
            );


        if (!OneSignal) {
            return false;
        }


        await withTimeout(
            OneSignal.logout(),
            7000
        );


        console.log(
            "✅ OneSignal user logged out"
        );


        return true;


    } catch (error) {

        console.warn(
            "⚠️ OneSignal logout failed:",
            error
        );


        return false;
    }

}
