import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';

import { auth } from '@/configs/firebase';
import { User } from '@/types/database';
import { createUserProfile, subscribeToUser } from '@/utils/database';

const profile = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        
        // Create user profile if it doesn't exist
        try {
          const profileData: any = {
            email: user.email || '',
            name: user.displayName || 'User',
            country: 'RO' // You can detect this or ask user
          };
          
          // Only add photoURL if it exists
          if (user.photoURL) {
            profileData.photoURL = user.photoURL;
          }
          
          await createUserProfile(user.uid, profileData);
        } catch (error) {
          console.log('User profile might already exist:', error);
        }
      } else {
        setUid(null);
        setUserData(null);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!uid) return;
    
    // Listen to user data
    const unsubUser = subscribeToUser(uid, (user) => {
      setUserData(user);
    });
    
    return () => {
      unsubUser();
    };
  }, [uid]);
  
  
  // User data from database or fallback
  const userInfo = {
    balance: userData?.balance || 0,
    joinDate: userData?.joinedAt 
      ? `Member since ${userData.joinedAt instanceof Date 
          ? userData.joinedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : new Date((userData.joinedAt as any).toDate()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
      : "Member since recently",
    email: userData?.email || auth.currentUser?.email || 'No email',
    name: userData?.name || auth.currentUser?.displayName || 'User'
  };

  const showSuccess = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', message);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setIsLoading(true);
            signOut(auth)
              .then(() => {
                showSuccess('Signed out successfully');
                router.replace('/(auth)');
              })
              .catch((error) => {
                console.error('Sign out error:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              })
              .finally(() => {
                setIsLoading(false);
              });
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'gift-outline',
      title: 'Rewards History',
      subtitle: 'View your earned rewards',
      onPress: () => console.log('Rewards History'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => console.log('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => console.log('Help & Support'),
    },
    {
      icon: 'document-text-outline',
      title: 'Terms & Conditions',
      subtitle: 'Read our terms and policies',
      onPress: () => console.log('Terms & Conditions'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      onPress: () => console.log('Privacy Policy'),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userInfo.email ? userInfo.email.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userInfo.name}</Text>
          <Text style={styles.userEmail}>{userInfo.email}</Text>
          <Text style={styles.joinDate}>{userInfo.joinDate}</Text>
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceAmount}>{userInfo.balance.toLocaleString()} Credits</Text>
          </View>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={28} color={COLORS.primary} />
          </View>
        </View>
        <TouchableOpacity style={styles.topUpButton}>
          <Ionicons name="add" size={20} color={COLORS.primary} />
          <Text style={styles.topUpText}>Complete Surveys</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSoft} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity 
        style={styles.signOutButton} 
        onPress={handleSignOut}
        disabled={isLoading}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Earnly v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
  },
  settingsButton: {
    padding: 8,
  },
  userCard: {
    backgroundColor: COLORS.card,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: COLORS.textSoft,
  },
  balanceCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSoft,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
  },
  balanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  topUpText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.primary,
    marginLeft: 8,
  },
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: COLORS.textSoft,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: COLORS.danger,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: COLORS.textSoft,
  },
});