import { useUser } from '@/context/UserContext';
import { signIn } from '@/services/authService_backend';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export default function LoginScreen() {
  const router = useRouter();
  const { loadUser } = useUser();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // Input focus animations
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animation values - staggered entrance
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.95);
  const cardTranslateY = useSharedValue(20);
  
  // Individual input field animations (staggered)
  const input1Opacity = useSharedValue(0);
  const input1TranslateY = useSharedValue(20);
  const input2Opacity = useSharedValue(0);
  const input2TranslateY = useSharedValue(20);
  
  // Options row and button animations
  const optionsOpacity = useSharedValue(0);
  const submitButtonScale = useSharedValue(1);
  const submitButtonOpacity = useSharedValue(0);
  
  // Password eye icon rotation
  const eyeIconRotation = useSharedValue(0);

  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
    headerTranslateY.value = withSpring(0, {
      damping: 16,
      stiffness: 100,
      mass: 1,
    });

    // Card animation - entrance with scale and fade
    cardOpacity.value = withDelay(
      100,
      withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.ease),
      })
    );
    cardScale.value = withDelay(
      100,
      withSpring(1, {
        damping: 12,
        stiffness: 100,
        mass: 0.8,
      })
    );
    cardTranslateY.value = withDelay(
      100,
      withSpring(0, {
        damping: 15,
        stiffness: 90,
        mass: 1,
      })
    );

    // Staggered input field animations (100ms apart)
    const inputDelay = 250;
    const stagger = 100;

    // Input 1 - Email
    input1Opacity.value = withDelay(inputDelay, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    input1TranslateY.value = withDelay(inputDelay, withSpring(0, { damping: 15, stiffness: 90, mass: 1 }));

    // Input 2 - Password
    input2Opacity.value = withDelay(inputDelay + stagger, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    input2TranslateY.value = withDelay(inputDelay + stagger, withSpring(0, { damping: 15, stiffness: 90, mass: 1 }));

    // Options row animation
    optionsOpacity.value = withDelay(inputDelay + stagger * 2, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));

    // Submit button animation
    submitButtonOpacity.value = withDelay(inputDelay + stagger * 3, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
  }, []);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
  }));

  // Individual input field animated styles
  const input1Style = useAnimatedStyle(() => ({
    opacity: input1Opacity.value,
    transform: [{ translateY: input1TranslateY.value }],
  }));

  const input2Style = useAnimatedStyle(() => ({
    opacity: input2Opacity.value,
    transform: [{ translateY: input2TranslateY.value }],
  }));

  const optionsStyle = useAnimatedStyle(() => ({
    opacity: optionsOpacity.value,
  }));

  const submitButtonStyle = useAnimatedStyle(() => ({
    opacity: submitButtonOpacity.value,
    transform: [{ scale: submitButtonScale.value }],
  }));

  // Eye icon rotation animation
  const eyeIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${eyeIconRotation.value}deg` }],
  }));

  // Validation functions
  const validateEmail = (email: string) => {
    return email.endsWith('.edu') && email.includes('@');
  };

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'email':
        if (value.trim() === '') return 'Email is required';
        if (!validateEmail(value)) return 'Must be a valid .edu email';
        return '';
      case 'password':
        return value.trim() === '' ? 'Password is required' : '';
      default:
        return '';
    }
  };

  const handleLogin = async () => {
    const newErrors = {
      email: validateField('email', email),
      password: validateField('password', password),
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== '');

    if (!hasErrors) {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Button press animation
      submitButtonScale.value = withSpring(0.96, {
        damping: 10,
        stiffness: 300,
      }, () => {
        submitButtonScale.value = withSpring(1, {
          damping: 10,
          stiffness: 300,
        });
      });

      try {
        // Sign in with backend API
        const response = await signIn(email, password);
        console.log('Logged in user:', response.data?.user);
        
        // Reload user data in context to update isAuthenticated state
        await loadUser();
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate directly to tabs without showing alert
        router.replace('/(tabs)');
      } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', error.message || 'Failed to sign in. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Animated Pressable component
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const AnimatedView = Animated.View;

  return (
    <>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#FFFFFF']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button - Navigate to landing page to avoid GO_BACK errors */}
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Navigate to landing page instead of using router.back()
                // This prevents "GO_BACK" errors when there's no navigation history
                router.replace('/');
              }} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#14532D" />
            </Pressable>

            {/* Header */}
            <AnimatedView style={[styles.header, headerStyle]}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </AnimatedView>

            {/* Form Card */}
            <AnimatedView style={[styles.formCard, cardStyle]}>
              {/* Form */}
              <View style={styles.form}>
                {/* Email */}
                <AnimatedView style={[styles.inputGroup, input1Style]}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? '#22C55E' : '#94a3b8'} />
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputWithIcon,
                        errors.email ? styles.inputError : null,
                        focusedInput === 'email' ? styles.inputFocused : null,
                      ]}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setErrors({ ...errors, email: '' });
                      }}
                      onFocus={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFocusedInput('email');
                      }}
                      onBlur={() => setFocusedInput(null)}
                      placeholder="your.name@university.edu"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      textContentType="emailAddress"
                      autoComplete="email"
                    />
                    {email && !errors.email && email.includes('@') && email.endsWith('.edu') && (
                      <View style={styles.inputIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                      </View>
                    )}
                  </View>
                  {errors.email ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#ef4444" />
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                  ) : null}
                </AnimatedView>

                {/* Password */}
                <AnimatedView style={[styles.inputGroup, input2Style]}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? '#22C55E' : '#94a3b8'} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputWithIcon,
                          styles.passwordInput,
                          errors.password ? styles.inputError : null,
                          focusedInput === 'password' ? styles.inputFocused : null,
                        ]}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setErrors({ ...errors, password: '' });
                        }}
                        onFocus={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setFocusedInput('password');
                        }}
                        onBlur={() => setFocusedInput(null)}
                        placeholder="Enter your password"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showPassword}
                        textContentType="password"
                        autoComplete="password"
                      />
                    </View>
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const newValue = !showPassword;
                        setShowPassword(newValue);
                        // Rotate icon animation
                        eyeIconRotation.value = withSpring(newValue ? 180 : 0, {
                          damping: 10,
                          stiffness: 200,
                        });
                      }}
                    >
                      <Animated.View style={eyeIconStyle}>
                        <Ionicons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="#94a3b8"
                        />
                      </Animated.View>
                    </Pressable>
                  </View>
                  {errors.password ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#ef4444" />
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                  ) : null}
                </AnimatedView>

                {/* Remember Me & Forgot Password */}
                <AnimatedView style={[styles.optionsRow, optionsStyle]}>
                  <Pressable
                    style={styles.checkboxContainer}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRememberMe(!rememberMe);
                    }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxChecked,
                        !rememberMe && styles.checkboxUnchecked,
                      ]}
                    >
                      {rememberMe && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Remember Me</Text>
                  </Pressable>

                  <Pressable 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/forgot-password');
                    }}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </Pressable>
                </AnimatedView>

                {/* Login Button */}
                <AnimatedPressable 
                  style={[
                    styles.loginButton,
                    isLoading && styles.loginButtonDisabled,
                    submitButtonStyle,
                  ]} 
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#3BB75E', '#2CA654']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.submitIcon} />
                      </>
                    )}
                  </LinearGradient>
                </AnimatedPressable>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account? </Text>
                  <Pressable 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/create-account');
                    }}
                  >
                    <Text style={styles.signupLink}>Create Account</Text>
                  </Pressable>
                </View>
              </View>
            </AnimatedView>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#14532D',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 17,
    color: '#475569',
    lineHeight: 24,
    fontWeight: '400',
  },
  // Form Card - Soft white with subtle green tint, blending with background
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 28,
    padding: 28,
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 252, 231, 0.6)',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
    letterSpacing: 0.2,
    opacity: 0.85,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 252, 231, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 48,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    flex: 1,
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#22C55E',
    borderWidth: 2,
    shadowColor: '#22C55E',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inputError: {
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.1,
  },
  inputIcon: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 80,
  },
  eyeButton: {
    position: 'absolute',
    right: 48,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 6,
    zIndex: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  checkboxUnchecked: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(220, 252, 231, 0.6)',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#475569',
    opacity: 0.9,
  },
  forgotPasswordText: {
    fontSize: 15,
    color: '#22C55E',
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 18,
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  submitIcon: {
    marginLeft: 4,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 15,
    color: '#94a3b8',
  },
  signupLink: {
    fontSize: 15,
    color: '#22C55E',
    fontWeight: '600',
  },
});

