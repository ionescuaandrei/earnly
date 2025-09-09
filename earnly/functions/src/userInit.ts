import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

// Initialize Firebase Admin (if not already done)
if (!initializeApp.length) {
  initializeApp();
}

const db = getFirestore();

// Initialize financial fields when a new user is created
export const initializeUserFinancials = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    if (!userData) {
      console.log("No user data found");
      return;
    }

    // Check if financial fields are already set
    if (userData.balance !== undefined || userData.totalEarned !== undefined) {
      console.log("Financial fields already initialized");
      return;
    }

    try {
      // Initialize financial fields using admin privileges
      await db.collection("users").doc(userId).update({
        balance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        updatedAt: new Date()
      });

      console.log(`Initialized financial fields for user: ${userId}`);
    } catch (error) {
      console.error("Error initializing user financials:", error);
    }
  }
);
