import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { COLORS } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

const StartScreen = () => {
  const handleGetStarted = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Welcome Text */}
      <Text style={styles.welcomeText}>
        Welcome to <Text style={styles.brandName}>Earnly</Text>
      </Text>

      {/* Description */}
      <Text style={styles.description}>Complete surveys and earn gift cards in minutes</Text>

      {/* Logo + Slogan Container */}
      <View style={styles.logoSloganContainer}>
        
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
      </View>

      {/* Get Started Button - Absolutely positioned */}
      <TouchableOpacity 
        style={styles.getStartedButton}
        onPress={handleGetStarted}
        activeOpacity={0.9}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StartScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: height * 0.15,
    paddingBottom: 60,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '400',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  brandName: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSoft,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: width * 0.85,
  },
  logoSloganContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {

    width: 370,
    height: 370,
  },
  slogan: {
    fontSize: 16,
    color: COLORS.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.7,
  },
  getStartedButton: {
    position: 'absolute',
    bottom: 10,
    left: 32,
    right: 32,
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});