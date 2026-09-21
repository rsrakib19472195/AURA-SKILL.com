// ============================================================
// FIREBASE UID → ONESIGNAL EXTERNAL ID
// ============================================================

export async function linkOneSignalUser(user) {

    if (!user?.uid) {
        console.warn("⚠️ Firebase user পাওয়া যায়নি.");
        return false;
    }

    const uid = String(user.uid);

    try {

        console.log("================================");
        console.log("🔗 OneSignal linking শুরু");
        console.log("Firebase UID:", uid);
        console.log("================================");

        const OneSignal = await initOneSignal();

        // Web OneSignal SDK available না থাকলে
        if (!OneSignal) {

            console.warn(
                "⚠️ OneSignal Web SDK পাওয়া যায়নি."
            );

            console.warn(
                "⚠️ Native APK OneSignal-এর External ID এখান থেকে set করা সম্ভব নয়."
            );

            return false;
        }

        // Firebase UID → OneSignal External ID
        await OneSignal.login(uid);

        console.log(
            "✅ OneSignal.login() completed"
        );

        // একটু সময় দিচ্ছি identity sync হওয়ার জন্য
        await new Promise(resolve =>
            setTimeout(resolve, 2000)
        );

        const externalId =
            OneSignal.User?.externalId || null;

        const oneSignalId =
            OneSignal.User?.onesignalId || null;

        const subscriptionId =
            OneSignal.User?.PushSubscription?.id || null;

        const optedIn =
            OneSignal.User?.PushSubscription?.optedIn ?? null;

        console.log("================================");
        console.log("📌 OneSignal Result");
        console.log("Firebase UID:", uid);
        console.log("External ID:", externalId);
        console.log("OneSignal User ID:", oneSignalId);
        console.log("Subscription ID:", subscriptionId);
        console.log("Subscribed:", optedIn);
        console.log("================================");

        // আসল verification
        if (externalId === uid) {

            console.log(
                "🎉 SUCCESS: Firebase UID successfully linked!"
            );

            return true;
        }

        console.warn(
            "❌ External ID Firebase UID-এর সাথে match করছে না."
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
