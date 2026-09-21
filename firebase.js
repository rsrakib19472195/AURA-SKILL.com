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
// FIREBASE INITIALIZATION
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

                    /*
                     * Native APK OneSignal থাকলে
                     * website login বন্ধ হবে না।
                     */

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

        /*
         * Web SDK না থাকলেও APK native notification
         * configured থাকতে পারে।
         */

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
            "⚠️ Push support check:",
            error
        );

        return true;
    }
}

// ============================================================
// PERMISSION STATUS
// ============================================================

export async function getOneSignalPermissionStatus() {

    try {

        const OneSignal =
            await initOneSignal();

        /*
         * Native APK notification permission
         * website থেকে control করা হচ্ছে না।
         */

        if (!OneSignal) {
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
            "⚠️ Permission status check:",
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
            "🔔 Notification setup শুরু..."
        );

        /*
         * এখানে সরাসরি:
         *
         * OneSignal.Notifications.requestPermission()
         *
         * call করা হচ্ছে না।
         *
         * কারণ APK-এর native notification permission
         * builder/native OneSignal handle করতে পারে।
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
            "✅ Notification setup completed"
        );

        return true;

    } catch (error) {

        console.warn(
            "⚠️ Notification setup warning:",
            error
        );

        /*
         * Notification error-এর কারণে
         * Firebase login বন্ধ হবে না।
         */

        return true;
    }
}

// ============================================================
// FIREBASE UID → ONESIGNAL EXTERNAL ID
// ============================================================

export async function linkOneSignalUser(user) {

    if (!user?.uid) {

        console.warn(
            "⚠️ Firebase user পাওয়া যায়নি."
        );

        return false;
    }

    const uid = String(user.uid);

    try {

        console.log(
            "================================"
        );

        console.log(
            "🔗 OneSignal linking শুরু"
        );

        console.log(
            "Firebase UID:",
            uid
        );

        console.log(
            "================================"
        );

        const OneSignal =
            await initOneSignal();

        /*
         * Web SDK পাওয়া না গেলে
         * native APK OneSignal-এর External ID
         * এখান থেকে set করা সম্ভব নয়।
         */

        if (!OneSignal) {

            console.warn(
                "⚠️ OneSignal Web SDK পাওয়া যায়নি."
            );

            console.warn(
                "⚠️ Native APK OneSignal subscription আলাদাভাবে configured থাকতে হবে."
            );

            return false;
        }

        // ====================================================
        // LOGIN / EXTERNAL ID
        // ====================================================

        await OneSignal.login(uid);

        console.log(
            "✅ OneSignal.login() completed"
        );

        // Identity sync হওয়ার জন্য ছোট delay
        await new Promise(resolve =>
            setTimeout(resolve, 2000)
        );

        // ====================================================
        // GET ONESIGNAL DATA
        // ====================================================

        const externalId =
            OneSignal.User?.externalId || null;

        const oneSignalId =
            OneSignal.User?.onesignalId || null;

        const subscriptionId =
            OneSignal.User?.PushSubscription?.id || null;

        const optedIn =
            OneSignal.User?.PushSubscription?.optedIn ??
            null;

        // ====================================================
        // DEBUG
        // ====================================================

        console.log(
            "================================"
        );

        console.log(
            "📌 ONESIGNAL RESULT"
        );

        console.log(
            "Firebase UID:",
            uid
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
            "================================"
        );

        // ====================================================
        // VERIFY EXTERNAL ID
        // ====================================================

        if (externalId === uid) {

            console.log(
                "🎉 SUCCESS!"
            );

            console.log(
                "Firebase UID successfully linked to OneSignal."
            );

            return true;
        }

        console.warn(
            "❌ External ID Firebase UID-এর সাথে match করছে না."
        );

        console.warn(
            "Expected:",
            uid
        );

        console.warn(
            "Received:",
            externalId
        );

        return false;

    } catch (error) {

        console.error(
            "❌ OneSignal linking failed:",
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
         * গুরুত্বপূর্ণ:
         *
         * Native APK-তে Web SDK unavailable হলে
         * Firebase UID-কে এখানে fake OneSignal External ID
         * হিসেবে return করা হচ্ছে না।
         *
         * এতে admin panel-এ ভুল ID দেখানোর সম্ভাবনা থাকে।
         */

        return null;

    } catch (error) {

        console.warn(
            "⚠️ External ID error:",
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
            "⚠️ OneSignal User ID error:",
            error
        );

        return null;
    }
}

// ============================================================
// GET SUBSCRIPTION ID
// ============================================================

export async function getOneSignalSubscriptionId() {

    try {

        const OneSignal =
            await initOneSignal();

        if (
            OneSignal &&
            OneSignal.User &&
            OneSignal.User.PushSubscription
        ) {

            return (
                OneSignal.User
                    .PushSubscription
                    .id || null
            );
        }

        return null;

    } catch (error) {

        console.warn(
            "⚠️ Subscription ID error:",
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

                permissionNative: "unknown",

                pushSupported: true,

                firebaseUID:
                    auth.currentUser
                        ? String(
                            auth.currentUser.uid
                        )
                        : null,

                externalId: null,

                oneSignalId: null,

                subscriptionId: null,

                optedIn: null,

                webSDK: false
            };
        }

        const firebaseUID =
            auth.currentUser
                ? String(auth.currentUser.uid)
                : null;

        const externalId =
            OneSignal.User?.externalId ||
            null;

        const oneSignalId =
            OneSignal.User?.onesignalId ||
            null;

        const subscriptionId =
            OneSignal.User
                ?.PushSubscription
                ?.id ||
            null;

        const optedIn =
            OneSignal.User
                ?.PushSubscription
                ?.optedIn ??
            null;

        const permission =
            OneSignal.Notifications
                ? OneSignal.Notifications.permission
                : true;

        const permissionNative =
            OneSignal.Notifications
                ? OneSignal.Notifications.permissionNative
                : "unknown";

        const pushSupported =
            OneSignal.Notifications &&
            typeof OneSignal.Notifications
                .isPushSupported === "function"

                ? OneSignal.Notifications
                    .isPushSupported()

                : true;

        return {

            apk: true,

            nativeNotification: true,

            webSDK: true,

            firebaseUID,

            permission,

            permissionNative,

            pushSupported,

            externalId,

            oneSignalId,

            subscriptionId,

            optedIn
        };

    } catch (error) {

        return {

            apk: true,

            nativeNotification: true,

            webSDK: false,

            firebaseUID:
                auth.currentUser
                    ? String(
                        auth.currentUser.uid
                    )
                    : null,

            permission: true,

            permissionNative: "unknown",

            pushSupported: true,

            externalId: null,

            oneSignalId: null,

            subscriptionId: null,

            optedIn: null,

            error:
                error?.message ||
                "OneSignal debug failed."
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

        /*
         * Firebase logout যেন OneSignal error-এর
         * কারণে আটকে না যায়।
         */

        return true;
    }
}
