// Shared referral reward logic for AURA SKILL.
// Reward: ৳10 to the referrer after the referred account has a positive balance (deposit).
import { db } from './firebase.js';
import {
  doc, getDoc, runTransaction, serverTimestamp, collection, setDoc, query, where, getDocs
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export async function processReferralReward(uid) {
  if (!uid) return { rewarded:false, reason:'no-user' };
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return { rewarded:false, reason:'user-not-found' };
  const user = snap.data() || {};
  if (!user.referredByUid) return { rewarded:false, reason:'no-referrer' };
  if (user.referralRewardPaid === true) return { rewarded:false, reason:'already-paid' };

  // Only an approved deposit unlocks the reward. Admin uses status "approved".
  // Support both deposits and transactions collections, and both common UID fields.
  try {
    let hasApprovedDeposit = false;
    for (const collectionName of ['deposits', 'transactions']) {
      for (const uidField of ['userId', 'uid']) {
        const depositQ = query(
          collection(db, collectionName),
          where(uidField, '==', uid),
          where('status', 'in', ['approved', 'Success', 'success'])
        );
        const depositSnap = await getDocs(depositQ);
        if (!depositSnap.empty) { hasApprovedDeposit = true; break; }
      }
      if (hasApprovedDeposit) break;
    }
    if (!hasApprovedDeposit) return { rewarded:false, reason:'no-approved-deposit-yet' };
  } catch (e) {
    console.error('Approved deposit check failed:', e);
    return { rewarded:false, reason:'deposit-check-failed' };
  }

  const referrerRef = doc(db, 'users', String(user.referredByUid));
  const historyId = `${uid}_${String(user.referredByUid)}`;
  const historyRef = doc(db, 'referralHistory', historyId);
  const reward = 10;

  try {
    await runTransaction(db, async (tx) => {
      const [newUserSnap, referrerSnap, historySnap] = await Promise.all([
        tx.get(userRef), tx.get(referrerRef), tx.get(historyRef)
      ]);
      if (!newUserSnap.exists() || !referrerSnap.exists()) throw new Error('REFERRER_NOT_FOUND');
      const freshUser = newUserSnap.data() || {};
      if (freshUser.referralRewardPaid === true) return;
      if (!(Number(freshUser.balance || 0) > 0)) return;
      if (historySnap.exists()) {
        tx.update(userRef, { referralRewardPaid:true, referralRewardAmount:reward, referralRewardAt:serverTimestamp() });
        return;
      }
      const referrer = referrerSnap.data() || {};
      tx.update(referrerRef, {
        balance: Number(referrer.balance || 0) + reward,
        referralCount: Number(referrer.referralCount || 0) + 1,
        successfulReferrals: Number(referrer.successfulReferrals || 0) + 1,
        referralBonusTotal: Number(referrer.referralBonusTotal || 0) + reward,
        updatedAt: serverTimestamp()
      });
      tx.update(userRef, {
        referralRewardPaid:true,
        referralRewardAmount:reward,
        referralRewardAt:serverTimestamp(),
        updatedAt:serverTimestamp()
      });
      tx.set(historyRef, {
        referrerUid: String(user.referredByUid),
        referrerCode: String(user.referredByCode || ''),
        referredUid: uid,
        referredUsername: String(freshUser.username || freshUser.name || ''),
        referredEmail: String(freshUser.email || ''),
        depositBalanceAtReward: Number(freshUser.balance || 0),
        rewardAmount: reward,
        status: 'paid',
        createdAt: serverTimestamp()
      });
    });
    return { rewarded:true, amount:reward };
  } catch (error) {
    console.error('Referral reward failed:', error);
    return { rewarded:false, reason:'permission-or-transaction-error', error };
  }
}