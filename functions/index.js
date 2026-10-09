
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

exports.verifyDeposit = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "প্রথমে login করুন।");
  }

  const uid = request.auth.uid;
  const trxId = String(request.data.trxId || "").trim();
  const gateway = String(request.data.gateway || "");
  const amount = Number(request.data.amount);
  const invoice = String(request.data.invoice || "");

  if (
    trxId.length < 4 ||
    trxId.length > 100 ||
    !["Bkash", "Nagad"].includes(gateway) ||
    !Number.isFinite(amount) ||
    amount < 10 ||
    amount > 10000000
  ) {
    throw new HttpsError("invalid-argument", "Payment তথ্য সঠিক নয়।");
  }

  // 1. twixoMessages-এ Transaction ID খুঁজুন
  const matches = await db.collection("twixoMessages")
    .where("trx_id", "==", trxId)
    .limit(2)
    .get();

  if (matches.size !== 1) {
    throw new HttpsError(
      "failed-precondition",
      "Transaction ID পাওয়া যায়নি অথবা একাধিক matching record আছে।"
    );
  }

  const sourceDoc = matches.docs[0];
  const source = sourceDoc.data();

  // 2. Amount যাচাই
  const receivedAmount = Number(source.amount);

  if (
    !Number.isFinite(receivedAmount) ||
    Math.round(receivedAmount * 100) !== Math.round(amount * 100)
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Payment amount মেলেনি।"
    );
  }

  // 3. Gateway message যাচাই
  const message = String(source.message || "").toLowerCase();
  const expected = gateway === "Bkash" ? "bkash" : "nagad";

  if (!message.includes(expected)) {
    throw new HttpsError(
      "failed-precondition",
      "Transaction message-এ নির্বাচিত gateway পাওয়া যায়নি।"
    );
  }

  const userRef = db.collection("users").doc(uid);

  // একই TrxID-এর জন্য deterministic document ID
  const transactionKey = Buffer.from(trxId).toString("base64url");
  const transactionRef = db.collection("transactions").doc(transactionKey);

  // 4. Atomic duplicate check + wallet credit
  await db.runTransaction(async (tx) => {
    const [sourceSnap, userSnap, existingSnap, oldTransactions] =
      await Promise.all([
        tx.get(sourceDoc.ref),
        tx.get(userRef),
        tx.get(transactionRef),
        tx.get(
          db.collection("transactions")
            .where("trxId", "==", trxId)
            .limit(20)
        )
      ]);

    if (!sourceSnap.exists) {
      throw new HttpsError(
        "failed-precondition",
        "Payment source record আর পাওয়া যাচ্ছে না।"
      );
    }

    const latestSource = sourceSnap.data();
    const latestMessage = String(latestSource.message || "").toLowerCase();

    if (
      Math.round(Number(latestSource.amount) * 100) !==
        Math.round(amount * 100) ||
      !latestMessage.includes(expected)
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Payment তথ্য পুনরায় যাচাইয়ে মেলেনি।"
      );
    }

    if (existingSnap.exists) {
      throw new HttpsError(
        "already-exists",
        "এই Transaction ID ইতোমধ্যে ব্যবহার করা হয়েছে।"
      );
    }

    // পুরোনো auto-ID transaction document-ও পরীক্ষা করা হবে
    const duplicate = oldTransactions.docs.some((item) => {
      const data = item.data();

      return (
        data.trxId === trxId ||
        data.transactionId === trxId
      );
    });

    if (duplicate) {
      throw new HttpsError(
        "already-exists",
        "এই Transaction ID ইতোমধ্যে ব্যবহার করা হয়েছে।"
      );
    }

    if (!userSnap.exists) {
      throw new HttpsError(
        "not-found",
        "আপনার users profile পাওয়া যায়নি।"
      );
    }

    tx.update(userRef, {
      balance: FieldValue.increment(amount)
    });

    tx.create(transactionRef, {
      userId: uid,
      userEmail: request.auth.token.email || "",
      amount,
      fee: 0,
      total: amount,
      gateway,
      method: gateway,
      trxId,
      transactionId: trxId,
      invoice,
      status: "approved",
      sourceMessageId: sourceDoc.id,
      createdAt: FieldValue.serverTimestamp(),
      verifiedAt: FieldValue.serverTimestamp()
    });
  });

  return {
    success: true,
    message: "Payment verified successfully"
  };
});
