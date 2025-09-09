import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

const db = getFirestore();

export const redeemReward = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { rewardId } = request.data;
  const uid = request.auth.uid;

  if (!rewardId) {
    throw new HttpsError('invalid-argument', 'rewardId is required');
  }

  try {
    // Run everything in a transaction
    const result = await db.runTransaction(async (transaction) => {
      // 1. Get user data
      const userRef = db.doc(`users/${uid}`);
      const userSnap = await transaction.get(userRef);
      
      if (!userSnap.exists) {
        throw new HttpsError('not-found', 'User not found');
      }
      
      const userData = userSnap.data()!;
      
      // Check if user is banned/locked
      if (userData.flags?.banned || userData.flags?.locked) {
        throw new HttpsError('permission-denied', 'Account is restricted');
      }

      // 2. Get reward data
      const rewardRef = db.doc(`rewards/${rewardId}`);
      const rewardSnap = await transaction.get(rewardRef);
      
      if (!rewardSnap.exists) {
        throw new HttpsError('not-found', 'Reward not found');
      }
      
      const rewardData = rewardSnap.data()!;
      
      // Validate reward
      if (!rewardData.active) {
        throw new HttpsError('failed-precondition', 'Reward is not active');
      }
      
      if (rewardData.stock <= 0) {
        throw new HttpsError('failed-precondition', 'Reward is out of stock');
      }
      
      if (userData.balance < rewardData.price) {
        throw new HttpsError('failed-precondition', 'Insufficient balance');
      }
      
      // Check region if specified
      if (rewardData.region && rewardData.region.length > 0) {
        if (!userData.country || !rewardData.region.includes(userData.country)) {
          throw new HttpsError('failed-precondition', 'Reward not available in your region');
        }
      }

      // 3. Find available gift code
      const codesQuery = db.collection(`giftCodes/${rewardId}/codes`)
        .where('status', '==', 'free')
        .limit(1);
      
      const codesSnap = await transaction.get(codesQuery);
      
      if (codesSnap.empty) {
        throw new HttpsError('failed-precondition', 'No codes available');
      }
      
      const codeDoc = codesSnap.docs[0];
      const codeData = codeDoc.data();

      // 4. Mark the code as used
      transaction.update(codeDoc.ref, {
        status: 'used',
        usedBy: uid,
        usedAt: FieldValue.serverTimestamp()
      });

      // 5. Debit user balance
      transaction.update(userRef, {
        balance: FieldValue.increment(-rewardData.price),
        totalRedeemed: FieldValue.increment(rewardData.price),
        updatedAt: FieldValue.serverTimestamp()
      });

      // 6. Update reward stock
      transaction.update(rewardRef, {
        stock: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp()
      });

      // 7. Create redemption record
      const redemptionRef = db.collection(`redemptions/${uid}/items`).doc();
      transaction.set(redemptionRef, {
        rewardId,
        title: rewardData.title,
        price: rewardData.price,
        code: codeData.code,
        status: 'delivered',
        deliveredAt: FieldValue.serverTimestamp(),
        redeemedAt: FieldValue.serverTimestamp(),
        instructions: rewardData.instructions || `Redeem this ${rewardData.title} code`,
        expiresAt: codeData.expiresAt || null
      });

      // 8. Create notification
      const notificationRef = db.collection(`notifications/${uid}/items`).doc();
      transaction.set(notificationRef, {
        type: 'redemption',
        title: 'Reward Redeemed!',
        message: `You successfully redeemed ${rewardData.title}`,
        data: {
          rewardId,
          redemptionId: redemptionRef.id,
          code: codeData.code
        },
        read: false,
        createdAt: FieldValue.serverTimestamp()
      });

      return {
        success: true,
        redemptionId: redemptionRef.id,
        code: codeData.code,
        title: rewardData.title,
        instructions: rewardData.instructions || `Redeem this ${rewardData.title} code`,
        expiresAt: codeData.expiresAt
      };
    });

    return result;

  } catch (error) {
    console.error('Redemption error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Redemption failed');
  }
});

// Cleanup function to release expired reservations
export const cleanupExpiredReservations = onSchedule("every 10 minutes", async () => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  try {
    // Find all expired reservations across all reward types
    const rewardsSnap = await db.collection('rewards').get();
    
    for (const rewardDoc of rewardsSnap.docs) {
      const rewardId = rewardDoc.id;
      
      const expiredCodesQuery = db.collection(`giftCodes/${rewardId}/codes`)
        .where('status', '==', 'reserved')
        .where('reservedAt', '<', tenMinutesAgo);
      
      const expiredCodesSnap = await expiredCodesQuery.get();
      
      if (!expiredCodesSnap.empty) {
        const batch = db.batch();
        let count = 0;
        
        expiredCodesSnap.docs.forEach((doc) => {
          batch.update(doc.ref, {
            status: 'free',
            reservedBy: null,
            reservedAt: null
          });
          count++;
        });
        
        // Update stock count
        if (count > 0) {
          batch.update(rewardDoc.ref, {
            stock: FieldValue.increment(count)
          });
        }
        
        await batch.commit();
        console.log(`Released ${count} expired codes for reward ${rewardId}`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});
