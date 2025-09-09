import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { WebView } from "react-native-webview";

import { auth, db } from '@/configs/firebase';

// Keep ONLY the public BitLabs token on the client
const BITLABS_TOKEN = "cdd8da4d-184d-4043-b36e-6e90604bd2a8";

export default function SurveysScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      if (!user) setLoading(false);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!uid) return;
    
    const unsubUser = onSnapshot(
      doc(db, "users", uid), 
      (snap) => {
        const data = snap.data();
        setBalance(data?.balance ?? 0);
        setTotalEarned(data?.totalEarned ?? 0);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
        setRefreshing(false);
      }
    );
    
    return unsubUser;
  }, [uid]);

  const onRefresh = () => {
    setRefreshing(true);
    // The onSnapshot listener will automatically update the data
    setTimeout(() => setRefreshing(false), 2000);
  };

  const showMessage = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'survey_completed') {
        showMessage('Survey completed! Your balance will update shortly.');
        setOpen(false);
      }
    } catch (error) {
      console.log('WebView message parsing error:', error);
    }
  };

  if (!uid) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.centeredContainer}>
          <Ionicons name="person-circle-outline" size={80} color={COLORS.textSoft} />
          <Text style={styles.notSignedInTitle}>Welcome to Earnly</Text>
          <Text style={styles.notSignedInText}>
            Please sign in to access surveys and start earning credits.
          </Text>
        </View>
      </View>
    );
  }

  const offerwallUrl = `https://web.bitlabs.ai?token=${BITLABS_TOKEN}&uid=${uid}`;

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
          <Text style={styles.headerTitle}>Earn Credits</Text>
          <Text style={styles.headerSubtitle}>Complete surveys to earn rewards</Text>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
              <Text style={styles.balanceUnit}>credits</Text>
            </View>
          </View>

          <View style={styles.earningsCard}>
            <View style={styles.earningsIconContainer}>
              <Ionicons name="trending-up" size={24} color={COLORS.success} />
            </View>
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsLabel}>Total Earned</Text>
              <Text style={styles.earningsAmount}>{totalEarned.toLocaleString()}</Text>
              <Text style={styles.earningsUnit}>credits</Text>
            </View>
          </View>
        </View>

        {/* Survey Section */}
        <View style={styles.surveySection}>
          <Text style={styles.sectionTitle}>Available Surveys</Text>
          <Text style={styles.sectionDescription}>
            Complete short surveys from our partner BitLabs to earn credits instantly.
          </Text>

          <View style={styles.surveyCard}>
            <View style={styles.surveyHeader}>
              <View style={styles.surveyIcon}>
                <Ionicons name="document-text" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.surveyInfo}>
                <Text style={styles.surveyTitle}>BitLabs Surveys</Text>
                <Text style={styles.surveyDescription}>
                  High-quality surveys with instant payouts
                </Text>
              </View>
            </View>

            <View style={styles.surveyFeatures}>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Instant rewards</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Multiple surveys daily</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.featureText}>Fair compensation</Text>
              </View>
            </View>

            <Pressable
              style={styles.openSurveysButton}
              onPress={() => setOpen(true)}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <Text style={styles.openSurveysText}>Open Survey Wall</Text>
            </Pressable>
          </View>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your data...</Text>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
          <View style={styles.tip}>
            <Text style={styles.tipText}>• Complete your profile for better survey matches</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipText}>• Answer honestly to maintain high survey quality</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipText}>• Check back daily for new survey opportunities</Text>
          </View>
        </View>
      </ScrollView>

      {/* BitLabs Modal */}
      <Modal 
        visible={open} 
        animationType="slide" 
        onRequestClose={() => setOpen(false)}
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>BitLabs Surveys</Text>
            </View>
            <Pressable 
              style={styles.closeButton}
              onPress={() => setOpen(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          
          <View style={styles.webviewContainer}>
            <WebView
              source={{ uri: offerwallUrl }}
              startInLoadingState
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              onMessage={handleWebViewMessage}
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.webviewLoadingText}>Loading surveys...</Text>
                </View>
              )}
              style={styles.webview}
            />
            
            {webViewLoading && (
              <View style={styles.webviewLoadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.webviewLoadingText}>Loading surveys...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  balanceContainer: {
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
  },
  balanceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSoft,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
  },
  balanceUnit: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
  },
  earningsCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earningsInfo: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSoft,
    marginBottom: 2,
  },
  earningsAmount: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
  },
  earningsUnit: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
  },
  surveySection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    marginBottom: 20,
    lineHeight: 20,
  },
  surveyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  surveyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  surveyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  surveyInfo: {
    flex: 1,
  },
  surveyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  surveyDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    lineHeight: 18,
  },
  surveyFeatures: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    marginLeft: 8,
  },
  openSurveysButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  openSurveysText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    marginTop: 12,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  tip: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  webviewLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  webviewLoadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSoft,
    marginTop: 16,
  },
});