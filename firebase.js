// firebase.js
// ============================================================
// AURA / AURA SKILL
// FIREBASE + ONESIGNAL
// APK SAFE VERSION
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
// FIREBASE
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
// ADMIN EMAIL
// ============================================================

export const ADMIN_EMAIL =
    "teamgamechangerofficial@gmail.com";

// ============================================================
// ONESIGNAL WEB SDK
// ============================================================

let oneSignalReadyPromise = null;

export function initOneSignal() {

    if (oneSignalReadyPromise) {
        return oneSignalReadyPromise;
    }

    oneSignalReadyPromise = new Promise((resolve) => {

        try {

            window.OneSignalDeferred =
                window.OneSignalDeferred || [];

            const initialize = async (OneSignal) => {

                try {

                    await OneSignal.init({
                        appId: ONESIGNAL_APP_ID
                    });

                    console.log(
                        "✅ OneSignal initialized"
                    );

                    resolve(OneSignal);

                } catch (error) {

                    console.warn(
                        "⚠️ OneSignal Web init failed:",
                        error
                    );

                    // APK native OneSignal থাকলে
                    // এই error login আটকাবে না।
                    resolve(null);
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
                document.createElement("script");

            script.src =
                "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

            script.defer = true;

            script.onload = () => {

                console.log(
                    "✅ OneSignal SDK loaded"
                );

                window.OneSignalDeferred.push(
                    initialize
                );
            };

            script.onerror = () => {

                console.warn(
                    "⚠️ OneSignal Web SDK unavailable."
                );

                resolve(null);
            };

            document.head.appendChild(script);

        } catch (error) {

            console.warn(
                "⚠️ OneSignal setup skipped:",
                error
            );

            resolve(null);
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

        // APK native notification
        if (!OneSignal) {
            return true;
        }

        if (
            OneSignal.Notifications &&
            typeof OneSignal.Notifications
                .isPushSupported === "function"
        ) {

            return OneSignal.Notifications
                .isPushSupported();
        }

        return true;

    } catch (error) {

        console.warn(
            "Push support check:",
            error
        );

        return true;
    }
}

// ============================================================
// PERMISSION STATUS
// IMPORTANT:
// এখানে native APK permission request হবে না.
// ============================================================

export async function getOneSignalPermissionStatus() {

    try {

        const OneSignal =
            await initOneSignal();

        if (!OneSignal) {

            // Native APK notification
            return true;
        }

        if (
            OneSignal.Notifications &&
            typeof OneSignal.Notifications
                .permission === "boolean"
        ) {

            return OneSignal.Notifications.permission;
        }

        return true;

    } catch (error) {

        console.warn(
            "Permission status check:",
            error
        );

        return true;
    }
}

// ============================================================
// REQUEST NOTIFICATION PERMISSION
// ============================================================

export async function requestOneSignalPermission() {

    try {

        console.log(
            "🔔 APK notification setup..."
        );

        /*
         * IMPORTANT
         *
         * এখানে আর:
         *
         * OneSignal.Notifications.requestPermission()
         *
         * call করা হচ্ছে না।
         *
         * কারণ APK-এর native notification
         * permission already configured.
         */

        if (
            auth.currentUser &&
            auth.currentUser.uid
        ) {

            await linkOneSignalUser(
                auth.currentUser
            );
        }

        console.log(
            "✅ APK notification ready"
        );

        // সবসময় success
        return true;

    } catch (error) {

        console.warn(
            "⚠️ Notification setup warning:",
            error
        );

        /*
         * APK native notification setup
         * website error-এর কারণে বন্ধ হবে না।
         */

        return true;
    }
}

// ============================================================
// FIREBASE UID → ONESIGNAL EXTERNAL ID
// ============================================================

export async function linkOneSignalUser(user) {

    if (!user || !user.uid) {

        console.warn(
            "⚠️ Firebase user not available."
        );

        return false;
    }

    const externalId =
        String(user.uid);

    console.log(
        "🔗 Firebase UID → OneSignal External ID"
    );

    console.log(
        "Firebase UID:",
        externalId
    );

    try {

        const OneSignal =
            await initOneSignal();

        /*
         * Web OneSignal available থাকলে
         * Firebase UID link করবে।
         */

        if (
            OneSignal &&
            typeof OneSignal.login === "function"
        ) {

            await OneSignal.login(
                externalId
            );

            console.log(
                "✅ OneSignal login successful"
            );

            try {

                console.log(
                    "External ID:",
                    OneSignal.User
                        ? OneSignal.User.externalId
                        : null
                );

                console.log(
                    "OneSignal ID:",
                    OneSignal.User
                        ? OneSignal.User.onesignalId
                        : null
                );

            } catch (_) {}

        } else {

            console.log(
                "ℹ️ Native APK OneSignal is active."
            );
        }

        return true;

    } catch (error) {

        console.warn(
            "⚠️ OneSignal linking warning:",
            error
        );

        /*
         * Login block করবে না।
         */

        return true;
    }
}

// ============================================================
// GET EXTERNAL ID
// ============================================================

export async function getOneSignalExternalId() {

    try {

        const OneSignal =
            await initOneSignal();

        if (
            OneSignal &&
            OneSignal.User
        ) {

            return (
                OneSignal.User.externalId ||
                null
            );
        }

        /*
         * Native APK-এর ক্ষেত্রে Firebase UID
         * external ID হিসেবে ব্যবহার করা হবে।
         */

        if (
            auth.currentUser &&
            auth.currentUser.uid
        ) {

            return String(
                auth.currentUser.uid
            );
        }

        return null;

    } catch (error) {

        console.warn(
            "External ID error:",
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

        if (
            OneSignal &&
            OneSignal.User
        ) {

            return (
                OneSignal.User.onesignalId ||
                null
            );
        }

        return null;

    } catch (error) {

        console.warn(
            "OneSignal User ID error:",
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

        if (!OneSignal) {

            return {
                apk: true,
                nativeNotification: true,
                permission: true,
                permissionNative: "granted",
                pushSupported: true,
                externalId:
                    auth.currentUser
                        ? String(
                            auth.currentUser.uid
                        )
                        : null,
                oneSignalId: null
            };
        }

        return {

            apk: true,

            permission:
                OneSignal.Notifications
                    ? OneSignal.Notifications.permission
                    : true,

            permissionNative:
                OneSignal.Notifications
                    ? OneSignal.Notifications
                        .permissionNative
                    : "granted",

            pushSupported:
                OneSignal.Notifications &&
                typeof OneSignal.Notifications
                    .isPushSupported === "function"
                    ? OneSignal.Notifications
                        .isPushSupported()
                    : true,

            externalId:
                OneSignal.User
                    ? OneSignal.User.externalId ||
                      null
                    : null,

            oneSignalId:
                OneSignal.User
                    ? OneSignal.User.onesignalId ||
                      null
                    : null
        };

    } catch (error) {

        return {

            apk: true,

            nativeNotification: true,

            permission: true,

            permissionNative: "granted",

            pushSupported: true,

            externalId:
                auth.currentUser
                    ? String(
                        auth.currentUser.uid
                    )
                    : null,

            oneSignalId: null,

            error: error.message
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

        if (
            OneSignal &&
            typeof OneSignal.logout === "function"
        ) {

            await OneSignal.logout();

            console.log(
                "✅ OneSignal logout successful"
            );
        }

        return true;

    } catch (error) {

        console.warn(
            "⚠️ OneSignal logout warning:",
            error
        );

        return true;
    }
}
