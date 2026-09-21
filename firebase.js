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
    apiKey: "AIzaSyA2wYMZAMx6p2GRC21KGgsHgiCoVz--81A",
    authDomain: "aura-arman-tour.firebaseapp.com",
    databaseURL: "https://aura-arman-tour-default-rtdb.firebaseio.com",
    projectId: "aura-arman-tour",
    storageBucket: "aura-arman-tour.firebasestorage.app",
    messagingSenderId: "502326798792",
    appId: "1:502326798792:web:2afd27cb9cd44da48cb8fd"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


/* =====================================================
   ONESIGNAL
===================================================== */

const ONESIGNAL_APP_ID =
    "b4420740-b9f6-4de7-8792-f6302ad38e4d";


let oneSignalReadyPromise = null;


export function initOneSignal() {

    if (oneSignalReadyPromise) {
        return oneSignalReadyPromise;
    }


    oneSignalReadyPromise = new Promise((resolve) => {

        try {

            window.OneSignalDeferred =
                window.OneSignalDeferred || [];


            /*
             * যদি SDK আগে থেকেই load হয়ে থাকে
             */

            if (
                window.OneSignal &&
                typeof window.OneSignal === "object"
            ) {

                initializeExistingOneSignal(
                    window.OneSignal,
                    resolve
                );

                return;
            }


            /*
             * SDK load
             */

            const existingScript =
                document.querySelector(
                    'script[src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"]'
                );


            const initialize =
                async (OneSignal) => {

                    await initializeExistingOneSignal(
                        OneSignal,
                        resolve
                    );

                };


            window.OneSignalDeferred.push(
                initialize
            );


            /*
             * Script already আছে
             */

            if (existingScript) {

                return;
            }


            /*
             * Script create
             */

            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";


            script.defer = true;


            script.onload = () => {

                console.log(
                    "✅ OneSignal SDK loaded"
                );

            };


            script.onerror = () => {

                console.error(
                    "❌ OneSignal SDK load failed"
                );

                resolve(null);

            };


            document.head.appendChild(
                script
            );


        } catch (error) {

            console.error(
                "❌ OneSignal setup failed:",
                error
            );

            resolve(null);

        }

    });


    return oneSignalReadyPromise;
}


/* =====================================================
   INITIALIZE EXISTING ONESIGNAL
===================================================== */

async function initializeExistingOneSignal(
    OneSignal,
    resolve
) {

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


        resolve(null);

    }

}


/* =====================================================
   LINK FIREBASE USER
===================================================== */

export async function linkOneSignalUser(
    user
) {

    if (!user?.uid) {

        console.warn(
            "⚠️ Firebase user পাওয়া যায়নি"
        );

        return false;
    }


    const uid =
        String(user.uid);


    try {

        const OneSignal =
            await initOneSignal();


        if (!OneSignal) {

            console.warn(
                "⚠️ OneSignal SDK পাওয়া যায়নি"
            );

            return false;
        }


        await OneSignal.login(
            uid
        );


        console.log(
            "✅ OneSignal.login:",
            uid
        );


        return true;


    } catch (error) {

        console.error(
            "❌ OneSignal login failed:",
            error
        );


        return false;

    }

}


/* =====================================================
   GET EXTERNAL ID
===================================================== */

export async function getOneSignalExternalId() {

    try {

        const OneSignal =
            await initOneSignal();


        if (!OneSignal) {
            return null;
        }


        return (
            OneSignal.User?.externalId ||
            null
        );


    } catch (error) {

        console.warn(
            "External ID error:",
            error
        );

        return null;

    }

}


/* =====================================================
   GET ONESIGNAL USER ID
===================================================== */

export async function getOneSignalUserId() {

    try {

        const OneSignal =
            await initOneSignal();


        if (!OneSignal) {
            return null;
        }


        return (
            OneSignal.User?.onesignalId ||
            null
        );


    } catch (error) {

        return null;

    }

}


/* =====================================================
   GET SUBSCRIPTION ID
===================================================== */

export async function getOneSignalSubscriptionId() {

    try {

        const OneSignal =
            await initOneSignal();


        if (!OneSignal) {
            return null;
        }


        return (
            OneSignal
                .User
                ?.PushSubscription
                ?.id ||
            null
        );


    } catch (error) {

        return null;

    }

}


/* =====================================================
   PUSH SUPPORTED
===================================================== */

export async function isOneSignalPushSupported() {

    try {

        const OneSignal =
            await initOneSignal();


        if (!OneSignal) {
            return false;
        }


        if (
            typeof OneSignal
                .Notifications
                ?.isPushSupported !==
            "function"
        ) {

            return false;
        }


        return await OneSignal
            .Notifications
            .isPushSupported();


    } catch (error) {

        return false;

    }

}


/* =====================================================
   REQUEST PERMISSION
===================================================== */

export async function requestOneSignalPermission() {

    try {

        const OneSignal =
            await initOneSignal();


        if (!OneSignal) {
            return false;
        }


        await OneSignal
            .Notifications
            .requestPermission();


        return true;


    } catch (error) {

        console.error(
            "Notification permission error:",
            error
        );

        return false;

    }

}
