// App.js - EcoRoute AI Mobile App with Authentication
// A sustainable AI chat app with barcode scanning and user accounts

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { API_BASE_URL } from './config';

// Firebase imports
import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

const { width, height } = Dimensions.get('window');

// ==================== AUTH SCREENS ====================

const LoginScreen = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged will handle the navigation
    } catch (error) {
      let message = 'Login failed';
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          message = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password';
          break;
        case 'auth/invalid-credential':
          message = 'Invalid email or password';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts. Please try again later';
          break;
        default:
          message = error.message;
      }
      Alert.alert('Login Failed', message);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter Email', 'Please enter your email address first');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Email Sent', 'Check your email for password reset instructions');
    } catch (error) {
      Alert.alert('Error', 'Could not send reset email. Check your email address.');
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={authStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Header */}
          <View style={authStyles.logoContainer}>
            <Text style={authStyles.logoEmoji}>🌱</Text>
            <Text style={authStyles.logoText}>EcoRoute</Text>
            <Text style={authStyles.tagline}>Sustainable AI Assistant</Text>
          </View>

          {/* Login Form */}
          <View style={authStyles.formContainer}>
            <Text style={authStyles.formTitle}>Welcome Back</Text>
            
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Email</Text>
              <TextInput
                style={authStyles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Password</Text>
              <View style={authStyles.passwordContainer}>
                <TextInput
                  style={authStyles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={authStyles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={authStyles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={authStyles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[authStyles.primaryButton, loading && authStyles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={authStyles.primaryButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={authStyles.divider}>
              <View style={authStyles.dividerLine} />
              <Text style={authStyles.dividerText}>OR</Text>
              <View style={authStyles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={authStyles.secondaryButton}
              onPress={onSwitchToSignup}
            >
              <Text style={authStyles.secondaryButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const SignupScreen = ({ onSignup, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: name.trim()
      });

      Alert.alert('Success', 'Account created successfully!');
      // onAuthStateChanged will handle the navigation
    } catch (error) {
      let message = 'Signup failed';
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak';
          break;
        default:
          message = error.message;
      }
      Alert.alert('Signup Failed', message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={authStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Header */}
          <View style={authStyles.logoContainerSmall}>
            <Text style={authStyles.logoEmojiSmall}>🌱</Text>
            <Text style={authStyles.logoTextSmall}>EcoRoute</Text>
          </View>

          {/* Signup Form */}
          <View style={authStyles.formContainer}>
            <Text style={authStyles.formTitle}>Create Account</Text>
            
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Name</Text>
              <TextInput
                style={authStyles.input}
                placeholder="Enter your name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Email</Text>
              <TextInput
                style={authStyles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Password</Text>
              <View style={authStyles.passwordContainer}>
                <TextInput
                  style={authStyles.passwordInput}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={authStyles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={authStyles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={authStyles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[authStyles.primaryButton, loading && authStyles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={authStyles.primaryButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={authStyles.divider}>
              <View style={authStyles.dividerLine} />
              <Text style={authStyles.dividerText}>OR</Text>
              <View style={authStyles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={authStyles.secondaryButton}
              onPress={onSwitchToLogin}
            >
              <Text style={authStyles.secondaryButtonText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ==================== MAIN APP ====================

const MainApp = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const scrollViewRef = useRef();

  // Barcode scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const isProcessingRef = useRef(false);

  // Credit system state
  const [totalCredits, setTotalCredits] = useState(0);
  const [lastEarnedCredits, setLastEarnedCredits] = useState(0);
  const [scanHistory, setScanHistory] = useState([]);

  // Profile modal
  const [showProfile, setShowProfile] = useState(false);

  // Check backend connection on mount
  useEffect(() => {
    checkConnection();
    loadCredits();
  }, []);

  // Load credits from storage (user-specific)
  const loadCredits = async () => {
    try {
      const userKey = user?.uid || 'anonymous';
      const savedCredits = await AsyncStorage.getItem(`ecoCredits_${userKey}`);
      const savedHistory = await AsyncStorage.getItem(`scanHistory_${userKey}`);
      if (savedCredits !== null) {
        setTotalCredits(parseInt(savedCredits, 10));
      }
      if (savedHistory !== null) {
        setScanHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.log('Error loading credits:', error);
    }
  };

  // Save credits to storage (user-specific)
  const saveCredits = async (credits, history) => {
    try {
      const userKey = user?.uid || 'anonymous';
      await AsyncStorage.setItem(`ecoCredits_${userKey}`, credits.toString());
      await AsyncStorage.setItem(`scanHistory_${userKey}`, JSON.stringify(history));
    } catch (error) {
      console.log('Error saving credits:', error);
    }
  };

  // Calculate credits based on Eco-Score
  const calculateCredits = (ecoScore) => {
    const creditTable = {
      'A': 100,
      'B': 75,
      'C': 50,
      'D': 25,
      'E': 10,
    };
    return creditTable[ecoScore] || 0;
  };

  // Get credit color based on amount
  const getCreditColor = (credits) => {
    if (credits >= 75) return '#4CAF50';
    if (credits >= 50) return '#8BC34A';
    if (credits >= 25) return '#FFC107';
    return '#FF9800';
  };

  const checkConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 8000 });
      if (response.data.status === 'ok') {
        setConnectionStatus('connected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  // ==================== BARCODE SCANNER FUNCTIONS ====================

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan barcodes');
        return;
      }
    }
    isProcessingRef.current = false;
    setScanned(false);
    setShowScanner(true);
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    console.log('Barcode scanned:', data, 'Type:', type);
    setScanned(true);
    setScanLoading(true);
    setShowScanner(false);
    
    try {
      console.log('Fetching from Open Food Facts...');
      
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${data}.json`,
        { timeout: 15000 }
      );

      console.log('API Response status:', response.data.status);

      if (response.data.status === 1) {
        const product = response.data.product;
        
        const productData = {
          barcode: data,
          name: product.product_name || 'Unknown Product',
          brand: product.brands || 'Unknown Brand',
          ecoScore: product.ecoscore_grade?.toUpperCase() || null,
          ecoScoreValue: product.ecoscore_score || null,
          nutriScore: product.nutriscore_grade?.toUpperCase() || null,
          novaGroup: product.nova_group || null,
          packaging: product.packaging || null,
          categories: product.categories || null,
          origins: product.origins || null,
          imageUrl: product.image_front_small_url || null,
          ecoScoreData: product.ecoscore_data || null,
        };

        console.log('Product found:', productData.name);
        setScanLoading(false);
        setProductInfo(productData);
        setShowProductModal(true);
      } else {
        console.log('Product not found in database');
        setScanLoading(false);
        Alert.alert(
          'Product Not Found',
          `No product found for barcode: ${data}\n\nThis product may not be in the Open Food Facts database.`,
          [
            { text: 'Scan Again', onPress: () => { 
              isProcessingRef.current = false;
              setScanned(false); 
              setShowScanner(true); 
            }},
            { text: 'Close', onPress: () => {
              isProcessingRef.current = false;
              setScanned(false);
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Error fetching product:', error.message);
      setScanLoading(false);
      Alert.alert(
        'Error',
        `Failed to fetch product information.\n\nError: ${error.message}`,
        [
          { text: 'Scan Again', onPress: () => { 
            isProcessingRef.current = false;
            setScanned(false); 
            setShowScanner(true); 
          }},
          { text: 'Close', onPress: () => {
            isProcessingRef.current = false;
            setScanned(false);
          }}
        ]
      );
    }
  };

  const lookupManualBarcode = () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }
    setShowManualInput(false);
    isProcessingRef.current = false;
    handleBarCodeScanned({ type: 'manual', data: manualBarcode.trim() });
    setManualBarcode('');
  };

  const getEcoScoreColor = (grade) => {
    const colors = {
      'A': '#1E8F4E',
      'B': '#60AC0E',
      'C': '#EEAE0E',
      'D': '#FF6F1E',
      'E': '#DF1F1F',
    };
    return colors[grade] || '#666';
  };

  const getEcoScoreDescription = (grade) => {
    const descriptions = {
      'A': 'Very low environmental impact',
      'B': 'Low environmental impact',
      'C': 'Moderate environmental impact',
      'D': 'High environmental impact',
      'E': 'Very high environmental impact',
    };
    return descriptions[grade] || 'Environmental impact unknown';
  };

  const getNovaDescription = (group) => {
    const descriptions = {
      1: 'Unprocessed or minimally processed',
      2: 'Processed culinary ingredients',
      3: 'Processed foods',
      4: 'Ultra-processed foods',
    };
    return descriptions[group] || 'Processing level unknown';
  };

  const addProductToChat = () => {
    if (!productInfo) return;

    const creditsEarned = calculateCredits(productInfo.ecoScore);
    const newTotalCredits = totalCredits + creditsEarned;
    
    const scanRecord = {
      barcode: productInfo.barcode,
      name: productInfo.name,
      ecoScore: productInfo.ecoScore,
      credits: creditsEarned,
      timestamp: new Date().toISOString(),
    };
    
    const newHistory = [...scanHistory, scanRecord];

    setTotalCredits(newTotalCredits);
    setLastEarnedCredits(creditsEarned);
    setScanHistory(newHistory);
    saveCredits(newTotalCredits, newHistory);

    const ecoMessage = productInfo.ecoScore
      ? `Eco-Score: ${productInfo.ecoScore} - ${getEcoScoreDescription(productInfo.ecoScore)}`
      : 'Eco-Score: Not available';

    const creditMessage = creditsEarned > 0 
      ? `\n\n🏆 +${creditsEarned} Eco Credits earned!`
      : '\n\n⚠️ No credits (Eco-Score unavailable)';

    const message = `📦 **${productInfo.name}**\n` +
      `Brand: ${productInfo.brand}\n` +
      `Barcode: ${productInfo.barcode}\n\n` +
      `🌱 ${ecoMessage}\n` +
      (productInfo.nutriScore ? `🥗 Nutri-Score: ${productInfo.nutriScore}\n` : '') +
      (productInfo.novaGroup ? `🏭 NOVA Group: ${productInfo.novaGroup} - ${getNovaDescription(productInfo.novaGroup)}` : '') +
      creditMessage;

    setMessages(prev => [...prev, {
      type: 'product',
      text: message,
      productInfo: productInfo,
      creditsEarned: creditsEarned
    }]);

    setShowProductModal(false);
    setProductInfo(null);
    isProcessingRef.current = false;
    setScanned(false);
  };

  // ==================== CHAT FUNCTIONS ====================

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    setMessages(prev => [...prev, { 
      type: 'user', 
      text: userMessage 
    }]);

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/chat`,
        { prompt: userMessage },
        { 
          timeout: 63000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const { answer, source, tokens, co2 } = response.data;

      setMessages(prev => [...prev, {
        type: 'ai',
        text: answer,
        source: source,
        tokens: tokens,
        co2: co2
      }]);

    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Failed to get response';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The model might still be loading.';
      } else if (error.response) {
        errorMessage = error.response.data?.error || 'Server error';
      } else if (error.request) {
        errorMessage = 'Cannot reach server. Check your connection.';
      }

      setMessages(prev => [...prev, {
        type: 'error',
        text: errorMessage
      }]);
    }

    setIsLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats`);
      setStats(response.data);
      setShowStats(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch stats');
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'rule-based': return '⚡';
      case 'local': return '🌱';
      case 'cloud': return '🌐';
      default: return '🤖';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'rule-based': return '#FFA500';
      case 'local': return '#4CAF50';
      case 'cloud': return '#2196F3';
      default: return '#666';
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderMessage = (message, index) => {
    if (message.type === 'user') {
      return (
        <View key={index} style={styles.userMessageContainer}>
          <View style={styles.userMessage}>
            <Text style={styles.userMessageText}>{message.text}</Text>
          </View>
        </View>
      );
    }

    if (message.type === 'error') {
      return (
        <View key={index} style={styles.errorMessageContainer}>
          <View style={styles.errorMessage}>
            <Text style={styles.errorMessageText}>❌ {message.text}</Text>
          </View>
        </View>
      );
    }

    if (message.type === 'product') {
      const info = message.productInfo;
      const credits = message.creditsEarned || 0;
      return (
        <View key={index} style={styles.aiMessageContainer}>
          <View style={[styles.productMessage, { borderLeftColor: getEcoScoreColor(info?.ecoScore) }]}>
            <View style={styles.productHeader}>
              <Text style={styles.productIcon}>📦</Text>
              <Text style={styles.productName}>{info?.name}</Text>
            </View>
            <Text style={styles.productBrand}>{info?.brand}</Text>
            
            {info?.ecoScore && (
              <View style={styles.scoreContainer}>
                <View style={[styles.scoreBadge, { backgroundColor: getEcoScoreColor(info.ecoScore) }]}>
                  <Text style={styles.scoreText}>🌱 {info.ecoScore}</Text>
                </View>
                <Text style={styles.scoreDescription}>
                  {getEcoScoreDescription(info.ecoScore)}
                </Text>
              </View>
            )}
            
            {!info?.ecoScore && (
              <View style={styles.noScoreContainer}>
                <Text style={styles.noScoreText}>🌱 Eco-Score not available</Text>
              </View>
            )}

            {info?.nutriScore && (
              <Text style={styles.additionalScore}>🥗 Nutri-Score: {info.nutriScore}</Text>
            )}
            
            {info?.novaGroup && (
              <Text style={styles.additionalScore}>
                🏭 NOVA {info.novaGroup}: {getNovaDescription(info.novaGroup)}
              </Text>
            )}

            {credits > 0 && (
              <View style={styles.creditsEarnedContainer}>
                <Text style={[styles.creditsEarnedText, { color: getCreditColor(credits) }]}>
                  🏆 +{credits} Eco Credits
                </Text>
              </View>
            )}

            <Text style={styles.barcodeText}>Barcode: {info?.barcode}</Text>
          </View>
        </View>
      );
    }

    // AI message
    return (
      <View key={index} style={styles.aiMessageContainer}>
        <View style={[styles.aiMessage, { borderLeftColor: getSourceColor(message.source) }]}>
          <View style={styles.sourceTag}>
            <Text style={[styles.sourceText, { color: getSourceColor(message.source) }]}>
              {getSourceIcon(message.source)} {message.source?.toUpperCase()}
            </Text>
            {message.tokens > 0 && (
              <Text style={styles.tokenText}>
                {message.tokens} tokens • {message.co2?.toFixed(4)}g CO₂
              </Text>
            )}
          </View>
          <Text style={styles.aiMessageText}>{message.text}</Text>
        </View>
      </View>
    );
  };

  // ==================== MODALS ====================

  const ScannerModal = () => (
    <Modal visible={showScanner} animationType="slide">
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity 
                style={styles.closeScanner}
                onPress={() => {
                  setShowScanner(false);
                  isProcessingRef.current = false;
                  setScanned(false);
                }}
              >
                <Text style={styles.closeScannerText}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <View style={styles.scannerFooter}>
              {scanLoading ? (
                <View style={styles.scanLoadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.scanLoadingText}>Fetching product info...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.scanInstructions}>
                    Point camera at a product barcode
                  </Text>
                  <TouchableOpacity 
                    style={styles.manualInputButton}
                    onPress={() => {
                      setShowScanner(false);
                      isProcessingRef.current = false;
                      setScanned(false);
                      setShowManualInput(true);
                    }}
                  >
                    <Text style={styles.manualInputButtonText}>⌨️ Enter barcode manually</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );

  const ManualInputModal = () => (
    <Modal visible={showManualInput} transparent animationType="fade">
      <View style={styles.statsOverlay}>
        <View style={styles.manualInputModal}>
          <Text style={styles.manualInputTitle}>Enter Barcode</Text>
          <Text style={styles.manualInputSubtitle}>
            Type the barcode number (e.g., 3017620422003)
          </Text>
          
          <TextInput
            style={styles.barcodeInput}
            value={manualBarcode}
            onChangeText={setManualBarcode}
            placeholder="Enter barcode..."
            placeholderTextColor="#666"
            keyboardType="numeric"
            autoFocus
          />
          
          <View style={styles.manualInputButtons}>
            <TouchableOpacity 
              style={styles.lookupButton}
              onPress={lookupManualBarcode}
            >
              <Text style={styles.lookupButtonText}>🔍 Look Up</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backToScanButton}
              onPress={() => {
                setShowManualInput(false);
                setManualBarcode('');
                isProcessingRef.current = false;
                setScanned(false);
                setShowScanner(true);
              }}
            >
              <Text style={styles.backToScanText}>📷 Back to Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowManualInput(false);
                setManualBarcode('');
                isProcessingRef.current = false;
                setScanned(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ProductModal = () => {
    if (!showProductModal || !productInfo) return null;

    return (
      <Modal visible={showProductModal} transparent animationType="fade">
        <View style={styles.statsOverlay}>
          <View style={styles.productModal}>
            <Text style={styles.productModalTitle}>🌱 Product Eco Info</Text>
            
            <Text style={styles.productModalName}>{productInfo.name}</Text>
            <Text style={styles.productModalBrand}>{productInfo.brand}</Text>

            <View style={styles.ecoScoreSection}>
              <Text style={styles.sectionTitle}>Environmental Impact</Text>
              {productInfo.ecoScore ? (
                <View style={styles.ecoScoreDisplay}>
                  <View style={[
                    styles.ecoScoreBadgeLarge,
                    { backgroundColor: getEcoScoreColor(productInfo.ecoScore) }
                  ]}>
                    <Text style={styles.ecoScoreLetter}>{productInfo.ecoScore}</Text>
                  </View>
                  <View style={styles.ecoScoreInfo}>
                    <Text style={styles.ecoScoreLabel}>Eco-Score</Text>
                    <Text style={styles.ecoScoreDesc}>
                      {getEcoScoreDescription(productInfo.ecoScore)}
                    </Text>
                    {productInfo.ecoScoreValue && (
                      <Text style={styles.ecoScorePoints}>
                        Score: {productInfo.ecoScoreValue}/100
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.notAvailable}>
                  <Text style={styles.notAvailableText}>
                    Eco-Score not available for this product
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.otherScores}>
              {productInfo.nutriScore && (
                <View style={styles.miniScore}>
                  <Text style={styles.miniScoreLabel}>Nutri-Score</Text>
                  <View style={[
                    styles.miniScoreBadge,
                    { backgroundColor: getEcoScoreColor(productInfo.nutriScore) }
                  ]}>
                    <Text style={styles.miniScoreText}>{productInfo.nutriScore}</Text>
                  </View>
                </View>
              )}
              
              {productInfo.novaGroup && (
                <View style={styles.miniScore}>
                  <Text style={styles.miniScoreLabel}>NOVA Group</Text>
                  <View style={styles.novaBadge}>
                    <Text style={styles.novaText}>{productInfo.novaGroup}</Text>
                  </View>
                  <Text style={styles.novaDesc}>{getNovaDescription(productInfo.novaGroup)}</Text>
                </View>
              )}
            </View>

            <View style={styles.creditsPreview}>
              <Text style={styles.creditsPreviewLabel}>Eco Credits You'll Earn:</Text>
              <View style={[
                styles.creditsPreviewBadge,
                { backgroundColor: getCreditColor(calculateCredits(productInfo.ecoScore)) }
              ]}>
                <Text style={styles.creditsPreviewIcon}>🏆</Text>
                <Text style={styles.creditsPreviewAmount}>
                  +{calculateCredits(productInfo.ecoScore)}
                </Text>
              </View>
              {!productInfo.ecoScore && (
                <Text style={styles.creditsPreviewNote}>
                  No credits available (Eco-Score missing)
                </Text>
              )}
            </View>

            <View style={styles.productModalButtons}>
              <TouchableOpacity 
                style={styles.addToChatButton}
                onPress={addProductToChat}
              >
                <Text style={styles.addToChatText}>
                  Add to Chat {calculateCredits(productInfo.ecoScore) > 0 ? `(+${calculateCredits(productInfo.ecoScore)} 🏆)` : ''}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.scanAgainButton}
                onPress={() => {
                  setShowProductModal(false);
                  setProductInfo(null);
                  openScanner();
                }}
              >
                <Text style={styles.scanAgainText}>Scan Another</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={() => {
                  setShowProductModal(false);
                  setProductInfo(null);
                  isProcessingRef.current = false;
                  setScanned(false);
                }}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const StatsModal = () => {
    if (!showStats || !stats) return null;

    return (
      <View style={styles.statsOverlay}>
        <View style={styles.statsModal}>
          <Text style={styles.statsTitle}>🌱 Environmental Impact</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Rule-based:</Text>
            <Text style={styles.statValue}>{stats.stats?.rule_based_responses || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Local AI:</Text>
            <Text style={styles.statValue}>{stats.stats?.local_responses || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cloud AI:</Text>
            <Text style={styles.statValue}>{stats.stats?.cloud_responses || 0}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>💨 CO₂ Saved:</Text>
            <Text style={styles.statValueGreen}>
              {(stats.stats?.co2_saved_grams || 0).toFixed(2)}g
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>💧 Water Saved:</Text>
            <Text style={styles.statValueGreen}>
              {(stats.stats?.water_saved_ml || 0).toFixed(0)}ml
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>🎫 Tokens Saved:</Text>
            <Text style={styles.statValueGreen}>
              {stats.stats?.tokens_saved || 0}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowStats(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ProfileModal = () => {
    if (!showProfile) return null;

    return (
      <Modal visible={showProfile} transparent animationType="fade">
        <View style={styles.statsOverlay}>
          <View style={styles.profileModal}>
            <Text style={styles.profileTitle}>👤 Profile</Text>
            
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            
            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            
            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>🏆 {totalCredits}</Text>
                <Text style={styles.profileStatLabel}>Eco Credits</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>📦 {scanHistory.length}</Text>
                <Text style={styles.profileStatLabel}>Products Scanned</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>🚪 Logout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeProfileButton}
              onPress={() => setShowProfile(false)}
            >
              <Text style={styles.closeProfileButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🌱 EcoRoute</Text>
          <View style={[
            styles.statusDot, 
            { backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#f44336' }
          ]} />
        </View>
        <View style={styles.headerButtons}>
          <View style={styles.creditsBadge}>
            <Text style={styles.creditsIcon}>🏆</Text>
            <Text style={styles.creditsText}>{totalCredits}</Text>
          </View>
          <TouchableOpacity onPress={openScanner} style={styles.scanButton}>
            <Text style={styles.scanButtonText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={fetchStats} style={styles.statsButton}>
            <Text style={styles.statsButtonText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Banner */}
      {user && (
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeText}>
            Welcome, {user.displayName || user.email?.split('@')[0]}! 👋
          </Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Welcome to EcoRoute!</Text>
              <Text style={styles.emptyText}>
                🤖 Chat with AI - I route queries to local or cloud{'\n\n'}
                📷 Scan products to see Eco-Scores and earn credits{'\n\n'}
                🏆 Earn more credits for eco-friendly choices!
              </Text>
            </View>
          )}
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask anything..."
            placeholderTextColor="#666"
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <ScannerModal />
      <ManualInputModal />
      <ProductModal />
      <StatsModal />
      <ProfileModal />
      
      {scanLoading && !showScanner && (
        <View style={styles.scanLoadingOverlay}>
          <View style={styles.scanLoadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.scanLoadingText}>Fetching product info...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ==================== ROOT APP COMPONENT ====================

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authScreen, setAuthScreen] = useState('login'); // 'login' or 'signup'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingLogo}>🌱</Text>
        <Text style={styles.loadingTitle}>EcoRoute</Text>
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!user) {
    if (authScreen === 'login') {
      return (
        <LoginScreen 
          onLogin={() => {}} 
          onSwitchToSignup={() => setAuthScreen('signup')} 
        />
      );
    } else {
      return (
        <SignupScreen 
          onSignup={() => {}} 
          onSwitchToLogin={() => setAuthScreen('login')} 
        />
      );
    }
  }

  return <MainApp user={user} onLogout={handleLogout} />;
}

// ==================== AUTH STYLES ====================

const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  logoContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logoEmojiSmall: {
    fontSize: 40,
    marginRight: 10,
  },
  logoTextSmall: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  formContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 20,
  },
  forgotPassword: {
    color: '#4CAF50',
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3a3a5e',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ==================== MAIN APP STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 80,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditsIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  creditsText: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scanButtonText: {
    fontSize: 16,
  },
  statsButton: {
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statsButtonText: {
    fontSize: 16,
  },
  profileButton: {
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  profileButtonText: {
    fontSize: 16,
  },
  welcomeBanner: {
    backgroundColor: '#2a2a4e',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  welcomeText: {
    color: '#ccc',
    fontSize: 14,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  aiMessage: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderLeftWidth: 3,
    padding: 12,
    maxWidth: '85%',
  },
  productMessage: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderLeftWidth: 4,
    padding: 14,
    maxWidth: '90%',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  productName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  productBrand: {
    color: '#888',
    fontSize: 13,
    marginBottom: 10,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  scoreDescription: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
  },
  noScoreContainer: {
    marginBottom: 8,
  },
  noScoreText: {
    color: '#888',
    fontSize: 13,
  },
  additionalScore: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  barcodeText: {
    color: '#666',
    fontSize: 11,
    marginTop: 8,
  },
  creditsEarnedContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#3a3a5e',
  },
  creditsEarnedText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sourceTag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tokenText: {
    fontSize: 10,
    color: '#666',
  },
  aiMessageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  errorMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  errorMessage: {
    backgroundColor: '#4a1a1a',
    borderRadius: 16,
    padding: 12,
    maxWidth: '85%',
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
  },
  errorMessageText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    color: '#666',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2a2a4e',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scannerHeader: {
    padding: 20,
    paddingTop: 50,
  },
  closeScanner: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  closeScannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
  },
  topLeft: {
    top: '25%',
    left: '15%',
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: '25%',
    right: '15%',
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: '25%',
    left: '15%',
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: '25%',
    right: '15%',
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerFooter: {
    padding: 30,
    alignItems: 'center',
  },
  scanInstructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  manualInputButton: {
    backgroundColor: 'rgba(156, 39, 176, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
  },
  manualInputButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scanLoadingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 16,
  },
  scanLoadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  scanLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  statsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsModal: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statValueGreen: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#3a3a5e',
    marginVertical: 12,
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Manual input modal
  manualInputModal: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  manualInputTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  manualInputSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  barcodeInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  manualInputButtons: {
    gap: 10,
  },
  lookupButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
  },
  lookupButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backToScanButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    padding: 14,
  },
  backToScanText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
  },
  cancelButtonText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
  // Product modal styles
  productModal: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  productModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
  },
  productModalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  productModalBrand: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  ecoScoreSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  ecoScoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ecoScoreBadgeLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ecoScoreLetter: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  ecoScoreInfo: {
    flex: 1,
  },
  ecoScoreLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ecoScoreDesc: {
    color: '#ccc',
    fontSize: 13,
    marginTop: 2,
  },
  ecoScorePoints: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  notAvailable: {
    backgroundColor: '#3a3a5e',
    padding: 16,
    borderRadius: 8,
  },
  notAvailableText: {
    color: '#888',
    textAlign: 'center',
  },
  otherScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  miniScore: {
    alignItems: 'center',
  },
  miniScoreLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
  },
  miniScoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniScoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  novaBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  novaText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  novaDesc: {
    color: '#888',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 100,
  },
  creditsPreview: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  creditsPreviewLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
  },
  creditsPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  creditsPreviewIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  creditsPreviewAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  creditsPreviewNote: {
    color: '#666',
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  productModalButtons: {
    gap: 10,
  },
  addToChatButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
  },
  addToChatText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanAgainButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    padding: 14,
  },
  scanAgainText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
  },
  dismissText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
  // Profile modal
  profileModal: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 14,
    width: '100%',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeProfileButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
  },
  closeProfileButtonText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
});
