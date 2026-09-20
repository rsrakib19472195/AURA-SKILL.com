// firebase.js
// ============================================================
// AURA / AURA SKILL - FIREBASE CONFIG
// Firebase + OneSignal User Linking
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
// ONESIGNAL READY
// ============================================================

let oneSignalReadyPromise = null;


// ============================================================
// INITIALIZE ONESIGNAL
// ============================================================

export function initOneSignal() {

    if (oneSignalReadyPromise) {
        return oneSignalReadyPromise;
    }

    oneSignalReadyPromise = new Promise((resolve, reject) => {

        try {

            window.OneSignalDeferred =
                window.OneSignalDeferred || [];

            // Check if SDK already exists
            if (
                document.querySelector(
                    'script[src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"]'
                )
            ) {

                window.OneSignalDeferred.push(
                    async function (OneSignal) {

                        try {

                            await OneSignal.init({
                                appId: ONESIGNAL_APP_ID
                            });

                            console.log(
                                "✅ OneSignal initialized"
                            );

                            resolve(OneSignal);

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


            // Load OneSignal SDK
            const script =
                document.createElement("script");

            script.src =
                "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

            script.defer = true;


            script.onload = function () {

                window.OneSignalDeferred.push(
                    async function (OneSignal) {

                        try {

                            await OneSignal.init({
                                appId: ONESIGNAL_APP_ID
                            });

                            console.log(
                                "✅ OneSignal initialized"
                            );

                            resolve(OneSignal);

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


            document.head.appendChild(script);

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
// LINK FIREBASE USER → ONESIGNAL EXTERNAL ID
// ============================================================

export async function linkOneSignalUser(user) {

    if (!user || !user.uid) {

        console.warn(
            "⚠️ Firebase user not available."
        );

        return false;
    }


    try {

        const OneSignal =
            await initOneSignal();


        const externalId =
            String(user.uid);


        await OneSignal.login(
            externalId
        );


        console.log(
            "✅ OneSignal linked successfully"
        );

        console.log(
            "Firebase UID:",
            externalId
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
// REQUEST NOTIFICATION PERMISSION
// ============================================================

export async function requestOneSignalPermission() {

    try {

        const OneSignal =
            await initOneSignal();


        await OneSignal.Notifications.requestPermission();


        console.log(
            "✅ OneSignal notification permission requested"
        );


        return true;


    } catch (error) {

        console.error(
            "❌ Notification permission error:",
            error
        );


        return false;
    }
}


// ============================================================
// GET ONESIGNAL SUBSCRIPTION STATUS
// ============================================================

export async function getOneSignalPermissionStatus() {

    try {

        const OneSignal =
            await initOneSignal();


        return OneSignal.Notifications.permission;


    } catch (error) {

        console.error(
            "❌ Could not get notification status:",
            error
        );

        return false;
    }
}
