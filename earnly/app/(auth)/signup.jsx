import { COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';

import { auth } from '@/configs/firebase';
import { createUserProfile } from '@/utils/database';

export default function signup() {
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = React.useState();
  const [password, setPassword] = React.useState();

  const showError = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Error', message);
    }
  };

  const showSuccess = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', message);
    }
  };

  const onCreateAccount = () => {
    if (!email || !password) {
      showError('Please fill in all fields');
      return;
    }

    // Basic password strength validation
    if (password.length < 6) {
      showError('Password should be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Signed up 
        const user = userCredential.user;
        console.log('User registered:', user);
        
        // Create user profile in Firestore
        try {
          const profileData = {
            email: user.email || email,
            name: user.displayName || 'User',
            country: 'RO' // You can detect this or ask user
          };
          
          // Only add photoURL if it exists
          if (user.photoURL) {
            profileData.photoURL = user.photoURL;
          }
          
          await createUserProfile(user.uid, profileData);
          
          showSuccess('Account created successfully!');
          
          // Navigate to main app
          setTimeout(() => {
            router.replace('/(tabs)/');
          }, 1000);
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
          showError('Account created but profile setup failed. Please try logging in.');
          router.replace('/(auth)/');
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        let errorMessage;
        
        switch (errorCode) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection';
            break;
          default:
            errorMessage = error.message || 'Registration failed. Please try again';
        }
        
        showError(errorMessage);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Register</Text>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.welcomeText}>Start your journey</Text>
        <Text style={styles.subText}>Register to fulfill the best trip of your life</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.textSoft}
            onChangeText={(value) => setEmail(value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.textSoft}
            onChangeText={(value) => setPassword(value)}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={onCreateAccount}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.signInButtonText}>Register</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => router.replace('/(auth)/')}
          disabled={isLoading}
        >
            <Text style={styles.signUpButtonText}>Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By signing in, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginLeft: 15,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    fontFamily: 'Poppins-Light',
    color: COLORS.textSoft,
    textAlign: 'center',
  },
  formContainer: {
    marginTop: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  signUpButton:{
    marginTop: 20,
    backgroundColor: 'transparent',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText:{
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: COLORS.textSoft,
  },
  link: {
    color: COLORS.primary,
    fontFamily: 'Poppins-Medium',
  },
});