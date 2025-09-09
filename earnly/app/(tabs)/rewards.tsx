import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  View
} from "react-native";

import { app, auth } from '@/configs/firebase';
import { EarningEntry, Reward, User } from '@/types/database';
import { createUserProfile, subscribeToRewards, subscribeToUser, subscribeToUserEarnings } from '@/utils/database';

const functions = getFunctions(app);

const rewards = () => {
  const [uid, setUid] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [earningHistory, setEarningHistory] = useState<EarningEntry[]>([]);
  const [rewardsCatalog, setRewardsCatalog] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [redeeming, setRedeeming] = useState<string | null>(null);

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
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!uid) return;
    
    // Listen to user data
    const unsubUser = subscribeToUser(uid, (user) => {
      setUserData(user);
      setLoading(false);
      setRefreshing(false);
    });

    // Listen to earning history
    const unsubEarnings = subscribeToUserEarnings(uid, (earnings) => {
      setEarningHistory(earnings);
    });

    // Listen to rewards catalog
    const unsubRewards = subscribeToRewards((rewards) => {
      setRewardsCatalog(rewards);
    }, userData?.country);
    
    return () => {
      unsubUser();
      unsubEarnings();
      unsubRewards();
    };
  }, [uid, userData?.country]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const showMessage = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  const handleRewardRedeem = async (reward: Reward) => {
    const userBalance = userData?.balance || 0;
    
    if (userBalance < reward.price) {
      showMessage(`You need ${reward.price - userBalance} more credits to redeem this reward.`);
      return;
    }

    if (!reward.active) {
      showMessage('This reward is currently unavailable.');
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem ${reward.title} for ${reward.price} credits?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              setRedeeming(reward.id);
              
              // Call the Cloud Function
              const redeemReward = httpsCallable(functions, 'redeemReward');
              const result = await redeemReward({ rewardId: reward.id });
              
              const data = result.data as any;
              
              if (data.success) {
                // Show success with the code
                Alert.alert(
                  'Redemption Successful!',
                  `Your ${reward.title} code:\n\n${data.code}\n\n${data.instructions}`,
                  [
                    {
                      text: 'Copy Code',
                      onPress: () => {
                        Clipboard.setString(data.code);
                        showMessage('Code copied to clipboard!');
                      }
                    },
                    { text: 'OK' }
                  ]
                );
              }
            } catch (error: any) {
              console.error('Redemption error:', error);
              showMessage(error.message || 'Redemption failed. Please try again.');
            } finally {
              setRedeeming(null);
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'bitlabs':
        return 'document-text';
      case 'survey':
        return 'clipboard';
      case 'bonus':
        return 'gift';
      default:
        return 'star';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'giftcard':
        return 'gift';
      case 'paypal':
        return 'card';
      case 'crypto':
        return 'logo-bitcoin';
      default:
        return 'wallet';
    }
  };

  const filteredRewards = selectedCategory === 'all' 
    ? rewardsCatalog 
    : rewardsCatalog.filter(reward => reward.category === selectedCategory);

  const renderEarningItem = ({ item }: { item: EarningEntry }) => (
    <View style={styles.earningItem}>
      <View style={styles.earningIcon}>
        <Ionicons 
          name={getSourceIcon(item.source) as any} 
          size={20} 
          color={COLORS.primary} 
        />
      </View>
      <View style={styles.earningInfo}>
        <Text style={styles.earningSource}>{item.source.toUpperCase()}</Text>
        <Text style={styles.earningDate}>{formatDate(item.at)}</Text>
      </View>
      <Text style={styles.earningAmount}>+{item.credits}</Text>
    </View>
  );

  const renderRewardItem = ({ item }: { item: Reward }) => {
    const userBalance = userData?.balance || 0;
    const getRewardIcon = (category: string) => {
      switch (category) {
        case 'giftcard':
          return 'gift-outline';
        case 'paypal':
          return 'card-outline';
        case 'crypto':
          return 'logo-bitcoin';
        default:
          return 'wallet-outline';
      }
    };

    return (
      <Pressable 
        style={[
          styles.rewardCard,
          !item.active && styles.rewardCardDisabled,
          userBalance < item.price && styles.rewardCardInsufficient
        ]}
        onPress={() => handleRewardRedeem(item)}
        disabled={!item.active || redeeming === item.id}
      >
        <View style={styles.rewardIconContainer}>
          <Ionicons name={getRewardIcon(item.category) as any} size={28} color={COLORS.primary} />
        </View>
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardTitle}>{item.title}</Text>
          <Text style={styles.rewardDescription}>{item.description}</Text>
          <View style={styles.rewardCost}>
            <Ionicons name="diamond" size={16} color={COLORS.primary} />
            <Text style={styles.rewardCostText}>{item.price} credits</Text>
          </View>
        </View>
        <View style={styles.rewardAction}>
          {redeeming === item.id ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : !item.active ? (
            <Text style={styles.unavailableText}>Soon</Text>
          ) : userBalance >= item.price ? (
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          ) : (
            <Text style={styles.insufficientText}>Need {item.price - userBalance}</Text>
          )}
        </View>
      </Pressable>
    );
  };

  if (!uid) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.centeredContainer}>
          <Ionicons name="trophy-outline" size={80} color={COLORS.textSoft} />
          <Text style={styles.notSignedInTitle}>Rewards Await</Text>
          <Text style={styles.notSignedInText}>
            Sign in to view your earning history and redeem amazing rewards.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rewards</Text>
          <Text style={styles.headerSubtitle}>Redeem your credits for real rewards</Text>
        </View>

        {/* Balance Overview */}
        <View style={styles.balanceOverview}>
          <View style={styles.balanceCard}>
            <Ionicons name="diamond" size={24} color={COLORS.primary} />
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceAmount}>{userData?.balance.toLocaleString() || '0'}</Text>
              <Text style={styles.balanceLabel}>Available Credits</Text>
            </View>
          </View>
          <View style={styles.totalEarnedCard}>
            <Ionicons name="trending-up" size={24} color={COLORS.success} />
            <View style={styles.totalEarnedInfo}>
              <Text style={styles.totalEarnedAmount}>{userData?.totalEarned.toLocaleString() || '0'}</Text>
              <Text style={styles.totalEarnedLabel}>Total Earned</Text>
            </View>
          </View>
        </View>

        {/* Reward Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Reward Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            <Pressable
              style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Ionicons name="apps" size={16} color={selectedCategory === 'all' ? '#FFFFFF' : COLORS.primary} />
              <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
                All
              </Text>
            </Pressable>
            <Pressable
              style={[styles.categoryChip, selectedCategory === 'paypal' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('paypal')}
            >
              <Ionicons name="card" size={16} color={selectedCategory === 'paypal' ? '#FFFFFF' : COLORS.primary} />
              <Text style={[styles.categoryChipText, selectedCategory === 'paypal' && styles.categoryChipTextActive]}>
                PayPal
              </Text>
            </Pressable>
            <Pressable
              style={[styles.categoryChip, selectedCategory === 'giftcard' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('giftcard')}
            >
              <Ionicons name="gift" size={16} color={selectedCategory === 'giftcard' ? '#FFFFFF' : COLORS.primary} />
              <Text style={[styles.categoryChipText, selectedCategory === 'giftcard' && styles.categoryChipTextActive]}>
                Gift Cards
              </Text>
            </Pressable>
            <Pressable
              style={[styles.categoryChip, selectedCategory === 'crypto' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('crypto')}
            >
              <Ionicons name="logo-bitcoin" size={16} color={selectedCategory === 'crypto' ? '#FFFFFF' : COLORS.primary} />
              <Text style={[styles.categoryChipText, selectedCategory === 'crypto' && styles.categoryChipTextActive]}>
                Crypto
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Available Rewards */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          <FlatList
            data={filteredRewards}
            renderItem={renderRewardItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Earning History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : earningHistory.length > 0 ? (
            <FlatList
              data={earningHistory.slice(0, 10)}
              renderItem={renderEarningItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="time-outline" size={40} color={COLORS.textSoft} />
              <Text style={styles.emptyHistoryText}>No earnings yet</Text>
              <Text style={styles.emptyHistorySubtext}>Complete surveys to start earning!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default rewards;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  notSignedInTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  notSignedInText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
  },
  balanceOverview: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceAmount: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
  },
  totalEarnedCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalEarnedInfo: {
    flex: 1,
  },
  totalEarnedAmount: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
  },
  totalEarnedLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.primary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  rewardsSection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  rewardCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardCardDisabled: {
    opacity: 0.6,
  },
  rewardCardInsufficient: {
    borderWidth: 1,
    borderColor: COLORS.textSoft,
  },
  rewardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    marginBottom: 6,
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardCostText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.primary,
  },
  rewardAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  unavailableText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSoft,
  },
  insufficientText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    textAlign: 'center',
  },
  historySection: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
  },
  earningItem: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earningInfo: {
    flex: 1,
  },
  earningSource: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.text,
  },
  earningDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
  },
  earningAmount: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: COLORS.success,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    marginLeft: 8,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: COLORS.text,
    marginTop: 12,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    marginTop: 4,
  },
});