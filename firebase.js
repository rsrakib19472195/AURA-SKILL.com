// firebase.js
// ============================================================
// AURA / AURA SKILL
// FIREBASE + ONESIGNAL
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
// ONESIGNAL APP ID
// ============================================================

export const ONESIGNAL_APP_ID =
    "b4420740-b9f6-4de7-8792-f6302ad38e4d";


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
    initializeApp(firebaseConfig);


export const auth =
    getAuth(app);


export const db =
    getFirestore(app);


// ============================================================
// DEFAULT PROFILE
// ============================================================

export const DEFAULT_PROFILE_PHOTO =
    "https://videotourl.com/images/1789800604014-b96e1edf-d789-4513-8557-9fb63a327a13.jpg";


// ============================================================
// ADMIN EMAIL
// ============================================================

export const ADMIN_EMAIL =
    "teamgamechangerofficial@gmail.com";


// ============================================================
// ONESIGNAL READY
// ============================================================

let oneSignalReadyPromise = null;


export function initOneSignal() {

    if (oneSignalReadyPromise) {

        return oneSignalReadyPromise;

    }


    oneSignalReadyPromise =
        new Promise((resolve, reject) => {

            try {

                window.OneSignalDeferred =
                    window.OneSignalDeferred || [];


                const initialize =
                    async (OneSignal) => {

                        try {

                            await OneSignal.init({

                                appId:
                                    ONESIGNAL_APP_ID

                            });


                            console.log(
                                "✅ OneSignal initialized"
                            );


                            resolve(
                                OneSignal
                            );


                        } catch (error) {

                            console.error(
                                "❌ OneSignal initialization failed:",
                                error
                            );


                            reject(error);

                        }

                    };


                const existingScript =
                    document.querySelector(
                        'script[src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"]'
                    );


                if (existingScript) {

                    window.OneSignalDeferred.push(
                        initialize
                    );

                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";


                script.defer =
                    true;


                script.onload =
                    () => {

                        console.log(
                            "✅ OneSignal SDK loaded"
                        );


                        window.OneSignalDeferred.push(
                            initialize
                        );

                    };


                script.onerror =
                    () => {

                        const error =
                            new Error(
                                "OneSignal SDK could not be loaded."
                            );


                        console.error(
                            "❌ OneSignal SDK load failed:",
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
// PUSH SUPPORT
// ============================================================

export async function isOneSignalPushSupported() {

    try {

        const OneSignal =
            await initOneSignal();


        const supported =
            OneSignal.Notifications
                .isPushSupported();


        console.log(
            "Push supported:",
            supported
        );


        return supported;

    } catch (error) {

        console.error(
            "❌ Push support check failed:",
            error
        );


        return false;

    }

}


// ============================================================
// PERMISSION STATUS
// ============================================================

export async function getOneSignalPermissionStatus() {

    try {

        const OneSignal =
            await initOneSignal();


        return (
            OneSignal.Notifications.permission
        );

    } catch (error) {

        console.error(
            "❌ Notification status error:",
            error
        );


        return false;

    }

}


// ============================================================
// REQUEST PERMISSION
//
// NOTE:
// APK native notification permission should be handled
// by the native OneSignal SDK.
//
// This function remains for browser compatibility.
// ============================================================

export async function requestOneSignalPermission() {

    try {

        const OneSignal =
            await initOneSignal();


        if (
            !OneSignal.Notifications
                .isPushSupported()
        ) {

            console.warn(
                "Push notification is not supported."
            );


            return false;

        }


        if (
            OneSignal.Notifications.permission ===
            true
        ) {

            return true;

        }


        if (
            OneSignal.Notifications.permissionNative ===
            "granted"
        ) {

            return true;

        }


        if (
            OneSignal.Notifications.permissionNative ===
            "denied"
        ) {

            return false;

        }


        const result =
            await OneSignal.Notifications
                .requestPermission();


        return (
            result === true ||
            OneSignal.Notifications.permission === true ||
            OneSignal.Notifications.permissionNative ===
                "granted"
        );


    } catch (error) {

        console.error(
            "❌ Notification permission error:",
            error
        );


        return false;

    }

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

        const OneSignal =
            await initOneSignal();


        const externalId =
            String(
                user.uid
            );


        console.log(
            "🔗 Linking Firebase UID to OneSignal..."
        );


        console.log(
            "Firebase UID:",
            externalId
        );


        /*
         * IMPORTANT
         *
         * This creates/updates the OneSignal
         * External ID association.
         */

        await OneSignal.login(
            externalId
        );


        console.log(
            "✅ OneSignal login successful"
        );


        console.log(
            "OneSignal External ID:",
            OneSignal.User.externalId
        );


        console.log(
            "OneSignal ID:",
            OneSignal.User.onesignalId
        );


        return true;


    } catch (error) {

        console.error(
            "❌ OneSignal user linking failed:",
            error
        );


        return false;

    }

}


// ============================================================
// GET EXTERNAL ID
// ============================================================

export async function getOneSignalExternalId() {

    try {

        const OneSignal =
            await initOneSignal();


        return (
            OneSignal.User.externalId ||
            null
        );

    } catch (error) {

        console.error(
            "❌ External ID error:",
            error
        );


        return null;

    }

}


// ============================================================
// GET ONESIGNAL USER ID
// ============================================================

export async function getOneSignalUserId() {

    try {

        const OneSignal =
            await initOneSignal();


        return (
            OneSignal.User.onesignalId ||
            null
        );

    } catch (error) {

        console.error(
            "❌ OneSignal User ID error:",
            error
        );


        return null;

    }

}


// ============================================================
// GET PUSH SUBSCRIPTION ID
// ============================================================

export async function getOneSignalSubscriptionId() {

    try {

        const OneSignal =
            await initOneSignal();


        /*
         * OneSignal v16
         */

        if (
            OneSignal.User &&
            OneSignal.User.PushSubscription
        ) {

            return (
                OneSignal.User
                    .PushSubscription
                    .id ||
                null
            );

        }


        /*
         * Older compatible access
         */

        if (
            OneSignal.User &&
            OneSignal.User.pushSubscription
        ) {

            return (
                OneSignal.User
                    .pushSubscription
                    .id ||
                null
            );

        }


        return null;


    } catch (error) {

        console.error(
            "❌ Subscription ID error:",
            error
        );


        return null;

    }

}


// ============================================================
// DEBUG INFO
// ============================================================

export async function getOneSignalDebugInfo() {

    try {

        const OneSignal =
            await initOneSignal();


        return {

            permission:
                OneSignal.Notifications
                    .permission,

            permissionNative:
                OneSignal.Notifications
                    .permissionNative,

            pushSupported:
                OneSignal.Notifications
                    .isPushSupported(),

            externalId:
                OneSignal.User
                    .externalId ||
                null,

            oneSignalId:
                OneSignal.User
                    .onesignalId ||
                null,

            subscriptionId:
                (
                    OneSignal.User
                        .PushSubscription
                        ?.id
                ) ||
                null

        };


    } catch (error) {

        console.error(
            "❌ OneSignal debug error:",
            error
        );


        return {
            error:
                error.message
        };

    }

}


// ============================================================
// LOGOUT
// ============================================================

export async function logoutOneSignalUser() {

    try {

        const OneSignal =
            await initOneSignal();


        await OneSignal.logout();


        console.log(
            "✅ OneSignal user logged out"
        );


        return true;


    } catch (error) {

        console.error(
            "❌ OneSignal logout failed:",
            error
        );


        return false;

    }

}
