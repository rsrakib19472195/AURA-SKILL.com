import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


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


export const ONESIGNAL_APP_ID =
    "b4420740-b9f6-4de7-8792-f6302ad38e4d";


const app =
    initializeApp(firebaseConfig);


export const auth =
    getAuth(app);


export const db =
    getFirestore(app);


export const DEFAULT_PROFILE_PHOTO =
    "https://videotourl.com/images/1789800604014-b96e1edf-d789-4513-8557-9fb63a327a13.jpg";


export const ADMIN_EMAIL =
    "teamgamechangerofficial@gmail.com";


let oneSignalReadyPromise = null;


// ============================================================
// INITIALIZE ONESIGNAL
// ============================================================

export function initOneSignal() {

    if (oneSignalReadyPromise) {

        return oneSignalReadyPromise;

    }


    oneSignalReadyPromise =
        new Promise(
            (resolve, reject) => {

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

                            reject(
                                new Error(
                                    "OneSignal SDK could not be loaded."
                                )
                            );

                        };


                    document.head.appendChild(
                        script
                    );

                } catch (error) {

                    reject(error);

                }

            }
        );


    return oneSignalReadyPromise;

}


// ============================================================
// LINK FIREBASE UID → ONESIGNAL
// ============================================================

export async function linkOneSignalUser(user) {

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


        const uid =
            String(user.uid);


        console.log(
            "🔗 Linking Firebase UID:",
            uid
        );


        await OneSignal.login(
            uid
        );


        console.log(
            "✅ OneSignal external ID linked:",
            uid
        );


        console.log(
            "OneSignal External ID:",
            OneSignal.User?.externalId
        );


        console.log(
            "OneSignal User ID:",
            OneSignal.User?.onesignalId
        );


        return true;

    } catch (error) {

        console.error(
            "❌ OneSignal linking failed:",
            error
        );

        return false;

    }

}


// ============================================================
// SUBSCRIPTION ID
// ============================================================

export async function getOneSignalSubscriptionId() {

    try {

        const OneSignal =
            await initOneSignal();


        return (
            OneSignal.User
                ?.PushSubscription
                ?.id ||
            null
        );

    } catch {

        return null;

    }

}


// ============================================================
// EXTERNAL ID
// ============================================================

export async function getOneSignalExternalId() {

    try {

        const OneSignal =
            await initOneSignal();


        return (
            OneSignal.User
                ?.externalId ||
            null
        );

    } catch {

        return null;

    }

}


// ============================================================
// ONESIGNAL USER ID
// ============================================================

export async function getOneSignalUserId() {

    try {

        const OneSignal =
            await initOneSignal();


        return (
            OneSignal.User
                ?.onesignalId ||
            null
        );

    } catch {

        return null;

    }

}


// ============================================================
// DEBUG
// ============================================================

export async function getOneSignalDebugInfo() {

    try {

        const OneSignal =
            await initOneSignal();


        return {

            permission:
                OneSignal.Notifications
                    ?.permission,

            permissionNative:
                OneSignal.Notifications
                    ?.permissionNative,

            pushSupported:
                OneSignal.Notifications
                    ?.isPushSupported(),

            externalId:
                OneSignal.User
                    ?.externalId ||
                null,

            oneSignalId:
                OneSignal.User
                    ?.onesignalId ||
                null,

            subscriptionId:
                OneSignal.User
                    ?.PushSubscription
                    ?.id ||
                null

        };

    } catch (error) {

        return {

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


        await OneSignal.logout();


        console.log(
            "✅ OneSignal logout successful"
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
