import { db } from '@/configs/firebase';
import { EarningEntry, Notification, Redemption, Reward, User } from '@/types/database';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';

// User operations
export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const createUserProfile = async (uid: string, userData: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Filter out undefined values to avoid Firestore errors
    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );
    
    // Set initial financial fields to 0 (allowed by security rules during creation)
    await setDoc(userRef, {
      ...cleanUserData,
      balance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      flags: {
        banned: false,
        locked: false,
        verified: true
      },
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Filter out undefined values to avoid Firestore errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(userRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Real-time user listener
export const subscribeToUser = (uid: string, callback: (user: User | null) => void) => {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ ...doc.data() } as User);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to user:', error);
    callback(null);
  });
};

// Earnings operations
export const getUserEarnings = async (uid: string, limitCount = 50): Promise<EarningEntry[]> => {
  try {
    const earningsQuery = query(
      collection(db, `userEarnings/${uid}/entries`),
      orderBy('at', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(earningsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EarningEntry[];
  } catch (error) {
    console.error('Error getting user earnings:', error);
    return [];
  }
};

// Real-time earnings listener
export const subscribeToUserEarnings = (uid: string, callback: (earnings: EarningEntry[]) => void) => {
  const earningsQuery = query(
    collection(db, `userEarnings/${uid}/entries`),
    orderBy('at', 'desc'),
    limit(50)
  );
  
  return onSnapshot(earningsQuery, (snapshot) => {
    const earnings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EarningEntry[];
    callback(earnings);
  }, (error) => {
    console.error('Error listening to earnings:', error);
    callback([]);
  });
};

// Rewards operations
export const getActiveRewards = async (userCountry?: string): Promise<Reward[]> => {
  try {
    let rewardsQuery = query(
      collection(db, 'rewards'),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(rewardsQuery);
    let rewards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reward[];
    
    // Filter by region if user country is provided
    if (userCountry) {
      rewards = rewards.filter(reward => 
        !reward.region || reward.region.length === 0 || reward.region.includes(userCountry)
      );
    }
    
    return rewards;
  } catch (error) {
    console.error('Error getting rewards:', error);
    return [];
  }
};

export const getRewardsByCategory = async (category: string, userCountry?: string): Promise<Reward[]> => {
  try {
    const rewardsQuery = query(
      collection(db, 'rewards'),
      where('active', '==', true),
      where('category', '==', category)
    );
    
    const snapshot = await getDocs(rewardsQuery);
    let rewards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reward[];
    
    // Filter by region if user country is provided
    if (userCountry) {
      rewards = rewards.filter(reward => 
        !reward.region || reward.region.length === 0 || reward.region.includes(userCountry)
      );
    }
    
    return rewards;
  } catch (error) {
    console.error('Error getting rewards by category:', error);
    return [];
  }
};

// Real-time rewards listener
export const subscribeToRewards = (callback: (rewards: Reward[]) => void, userCountry?: string) => {
  const rewardsQuery = query(
    collection(db, 'rewards'),
    where('active', '==', true)
  );
  
  return onSnapshot(rewardsQuery, (snapshot) => {
    let rewards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reward[];
    
    // Filter by region if user country is provided
    if (userCountry) {
      rewards = rewards.filter(reward => 
        !reward.region || reward.region.length === 0 || reward.region.includes(userCountry)
      );
    }
    
    callback(rewards);
  }, (error) => {
    console.error('Error listening to rewards:', error);
    callback([]);
  });
};

// Redemptions operations
export const getUserRedemptions = async (uid: string, limitCount = 50): Promise<Redemption[]> => {
  try {
    const redemptionsQuery = query(
      collection(db, `redemptions/${uid}/items`),
      orderBy('redeemedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(redemptionsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Redemption[];
  } catch (error) {
    console.error('Error getting user redemptions:', error);
    return [];
  }
};

// Real-time redemptions listener
export const subscribeToUserRedemptions = (uid: string, callback: (redemptions: Redemption[]) => void) => {
  const redemptionsQuery = query(
    collection(db, `redemptions/${uid}/items`),
    orderBy('redeemedAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(redemptionsQuery, (snapshot) => {
    const redemptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Redemption[];
    callback(redemptions);
  }, (error) => {
    console.error('Error listening to redemptions:', error);
    callback([]);
  });
};

// Notifications operations
export const getUserNotifications = async (uid: string, limitCount = 20): Promise<Notification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, `notifications/${uid}/items`),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(notificationsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (uid: string, notificationId: string) => {
  try {
    const notificationRef = doc(db, `notifications/${uid}/items`, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Real-time notifications listener
export const subscribeToUserNotifications = (uid: string, callback: (notifications: Notification[]) => void) => {
  const notificationsQuery = query(
    collection(db, `notifications/${uid}/items`),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
    callback(notifications);
  }, (error) => {
    console.error('Error listening to notifications:', error);
    callback([]);
  });
};
