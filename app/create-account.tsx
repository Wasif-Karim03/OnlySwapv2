import { signUp } from '@/services/authService_backend';
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
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.View;

export default function CreateAccountScreen() {
  const router = useRouter();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    university: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Mock universities data (sorted alphabetically)
  const universities = [
    'Columbia University',
    'Cornell University',
    'Duke University',
    'Harvard University',
    'Massachusetts Institute of Technology',
    'Michigan State University',
    'Northwestern University',
    'Ohio Wesleyan University',
    'Princeton University',
    'Stanford University',
    'University of California, Berkeley',
    'University of California, Los Angeles',
    'University of Chicago',
    'University of Michigan',
    'University of Pennsylvania',
    'University of Virginia',
    'Yale University',
  ];

  // University to email domain mapping
  const universityEmailMap: { [key: string]: string } = {
    'Ohio Wesleyan University': '@owu.edu',
    'Michigan State University': '@msu.edu',
  };

  const [filteredUniversities, setFilteredUniversities] = useState(universities);
  
  // Get email placeholder based on selected university
  const getEmailPlaceholder = () => {
    if (university && universityEmailMap[university]) {
      return `your.name${universityEmailMap[university]}`;
    }
    return 'your.name@university.edu';
  };

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
  const input3Opacity = useSharedValue(0);
  const input3TranslateY = useSharedValue(20);
  const input4Opacity = useSharedValue(0);
  const input4TranslateY = useSharedValue(20);
  const input5Opacity = useSharedValue(0);
  const input5TranslateY = useSharedValue(20);
  const input6Opacity = useSharedValue(0);
  const input6TranslateY = useSharedValue(20);
  
  // Checkboxes and button animations
  const checkboxesOpacity = useSharedValue(0);
  const submitButtonScale = useSharedValue(1);
  const submitButtonOpacity = useSharedValue(0);
  
  // Password eye icon rotation
  const eyeIconRotation = useSharedValue(0);
  const confirmEyeIconRotation = useSharedValue(0);
  
  // Input focus animations
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  // Password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '#e5e7eb' };
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    
    if (strength <= 2) return { strength, label: 'Weak', color: '#ef4444' };
    if (strength <= 4) return { strength, label: 'Medium', color: '#f59e0b' };
    return { strength, label: 'Strong', color: '#22C55E' };
  };

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

    // Input 1 - First Name
    input1Opacity.value = withDelay(inputDelay, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    input1TranslateY.value = withDelay(inputDelay, withSpring(0, { damping: 15, stiffness: 90, mass: 1 }));

    // Input 2 - Last Name
    input2Opacity.value = withDelay(inputDelay + stagger, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    input2TranslateY.value = withDelay(inputDelay + stagger, withSpring(0, { damping: 15, stiffness: 90, mass: 1 }));

    // Input 3 - University
    input3Opacity.value = withDelay(inputDelay + stagger * 2, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    input3TranslateY.value = withDelay(inputDelay + stagger * 2, withSpring(0, { damping: 15, stiffness: 90, mass: 1 }));

    // Input 4 - Email
    input4Opacity.value = withDelay(inputDelay + stagger * 3, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    input4TranslateY.value = withDelay(inputDelay + stagger * 3, withSpring(0, { damping: 15, stiffness: 90, mass: 1 }));

    // Input 5 - Password
    input5Opacity.value = withDelay(inputDelay + stagger * 4, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    input5TranslateY.value = withDelay(inputDelay + stagger * 4, withSpring(0, { damping: 15, stiffness: 90, mass: 1 }));

    // Input 6 - Confirm Password
    input6Opacity.value = withDelay(inputDelay + stagger * 5, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    input6TranslateY.value = withDelay(inputDelay + stagger * 5, withSpring(0, { damping: 15, stiffness: 90, mass: 1 }));

    // Checkboxes animation
    checkboxesOpacity.value = withDelay(inputDelay + stagger * 6, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));

    // Submit button animation
    submitButtonOpacity.value = withDelay(inputDelay + stagger * 7, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
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

  const input3Style = useAnimatedStyle(() => ({
    opacity: input3Opacity.value,
    transform: [{ translateY: input3TranslateY.value }],
  }));

  const input4Style = useAnimatedStyle(() => ({
    opacity: input4Opacity.value,
    transform: [{ translateY: input4TranslateY.value }],
  }));

  const input5Style = useAnimatedStyle(() => ({
    opacity: input5Opacity.value,
    transform: [{ translateY: input5TranslateY.value }],
  }));

  const input6Style = useAnimatedStyle(() => ({
    opacity: input6Opacity.value,
    transform: [{ translateY: input6TranslateY.value }],
  }));

  const checkboxesStyle = useAnimatedStyle(() => ({
    opacity: checkboxesOpacity.value,
  }));

  const submitButtonStyle = useAnimatedStyle(() => ({
    opacity: submitButtonOpacity.value,
    transform: [{ scale: submitButtonScale.value }],
  }));

  // Eye icon rotation animations
  const eyeIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${eyeIconRotation.value}deg` }],
  }));

  const confirmEyeIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${confirmEyeIconRotation.value}deg` }],
  }));

  // University search filter
  const handleUniversityChange = (text: string) => {
    setUniversity(text);
    if (text.length > 0) {
      const filtered = universities.filter((uni) =>
        uni.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUniversities(filtered);
      setShowUniDropdown(true);
    } else {
      setShowUniDropdown(false);
    }
  };

  const selectUniversity = (uni: string) => {
    setUniversity(uni);
    setShowUniDropdown(false);
  };

  // Validation functions
  const validateEmail = (email: string, selectedUniversity: string) => {
    // First check if it's a valid .edu email
    if (!email.endsWith('.edu') || !email.includes('@')) {
      return false;
    }
    
    // If university is in the mapping, validate the domain
    if (selectedUniversity && universityEmailMap[selectedUniversity]) {
      return email.endsWith(universityEmailMap[selectedUniversity]);
    }
    
    return true;
  };

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'firstName':
        return value.trim() === '' ? 'First name is required' : '';
      case 'lastName':
        return value.trim() === '' ? 'Last name is required' : '';
      case 'university':
        return value.trim() === '' ? 'University is required' : '';
      case 'email':
        if (value.trim() === '') return 'Email is required';
        if (!validateEmail(value, university)) {
          if (university && universityEmailMap[university]) {
            return `Must use ${universityEmailMap[university]} email`;
          }
          return 'Must be a valid .edu email';
        }
        return '';
      case 'password':
        if (value.trim() === '') return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (value.trim() === '') return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Button press animation
    submitButtonScale.value = withSequence(
      withSpring(0.96, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

    // Check if terms and privacy are accepted
    if (!acceptedTerms || !acceptedPrivacy) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Required',
        'You must accept both the Terms of Service and Privacy Policy to create an account.',
      );
      return;
    }

    const newErrors = {
      firstName: validateField('firstName', firstName),
      lastName: validateField('lastName', lastName),
      university: validateField('university', university),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== '');

    if (hasErrors) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!hasErrors) {
      setIsLoading(true);
      try {
        // Send verification code
        const response = await signUp(email, password, firstName, lastName, university);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate to verification screen with email
        setTimeout(() => {
          router.push({
            pathname: '/verify-code' as any,
            params: { email },
          });
        }, 200);
      } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', error.message || 'Failed to send verification code. Please try again.');
        setIsLoading(false);
      }
    }
  };

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
            {/* Back Button */}
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#14532D" />
            </Pressable>

            {/* Header */}
            <AnimatedView style={[styles.header, headerStyle]}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join the OnlySwap community
              </Text>
            </AnimatedView>

            {/* Form Card */}
            <AnimatedView style={[styles.formCard, cardStyle]}>
              {/* Form */}
              <View style={styles.form}>
              {/* First Name */}
              <AnimatedView style={[styles.inputGroup, input1Style]}>
                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="person-outline" size={20} color={focusedInput === 'firstName' ? '#22C55E' : '#94a3b8'} />
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithIcon,
                      errors.firstName ? styles.inputError : null,
                      focusedInput === 'firstName' ? styles.inputFocused : null,
                    ]}
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      setErrors({ ...errors, firstName: '' });
                    }}
                    onFocus={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFocusedInput('firstName');
                    }}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Enter your first name"
                    placeholderTextColor="#94a3b8"
                  />
                  {firstName && !errors.firstName && (
                    <View style={styles.inputIcon}>
                      <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    </View>
                  )}
                </View>
                {errors.firstName ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  </View>
                ) : null}
              </AnimatedView>

              {/* Last Name */}
              <AnimatedView style={[styles.inputGroup, input2Style]}>
                <Text style={styles.label}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="person-outline" size={20} color={focusedInput === 'lastName' ? '#22C55E' : '#94a3b8'} />
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithIcon,
                      errors.lastName ? styles.inputError : null,
                      focusedInput === 'lastName' ? styles.inputFocused : null,
                    ]}
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      setErrors({ ...errors, lastName: '' });
                    }}
                    onFocus={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFocusedInput('lastName');
                    }}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Enter your last name"
                    placeholderTextColor="#94a3b8"
                  />
                  {lastName && !errors.lastName && (
                    <View style={styles.inputIcon}>
                      <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    </View>
                  )}
                </View>
                {errors.lastName ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  </View>
                ) : null}
              </AnimatedView>

              {/* University */}
              <AnimatedView style={[
                styles.inputGroup, 
                input3Style,
                showUniDropdown && filteredUniversities.length > 0 && styles.inputGroupWithDropdown
              ]}>
                <Text style={styles.label}>University Name</Text>
                <View style={styles.universityContainer}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="school-outline" size={20} color={focusedInput === 'university' ? '#22C55E' : '#94a3b8'} />
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputWithIcon,
                        errors.university ? styles.inputError : null,
                        focusedInput === 'university' ? styles.inputFocused : null,
                      ]}
                      value={university}
                      onChangeText={handleUniversityChange}
                      onFocus={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFocusedInput('university');
                      }}
                      onBlur={() => {
                        // Delay hiding dropdown to allow for item selection
                        setTimeout(() => setFocusedInput(null), 200);
                      }}
                      placeholder="Search for your university"
                      placeholderTextColor="#94a3b8"
                    />
                    {university && !errors.university && (
                      <View style={styles.inputIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                      </View>
                    )}
                  </View>
                  {showUniDropdown && filteredUniversities.length > 0 && (
                    <View style={styles.dropdown}>
                      {filteredUniversities.slice(0, 5).map((uni, index) => (
                        <Pressable
                          key={index}
                          style={[
                            styles.dropdownItem,
                            index === filteredUniversities.slice(0, 5).length - 1 && styles.dropdownItemLast
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            selectUniversity(uni);
                            setFocusedInput(null);
                          }}
                        >
                          <Ionicons name="school-outline" size={18} color="#22C55E" style={styles.dropdownIcon} />
                          <Text style={styles.dropdownText}>{uni}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
                {errors.university ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{errors.university}</Text>
                  </View>
                ) : null}
              </AnimatedView>

              {/* Email */}
              <AnimatedView style={[
                styles.inputGroup, 
                input4Style,
                showUniDropdown && filteredUniversities.length > 0 && { marginTop: 220, zIndex: 1 }
              ]}>
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
                    placeholder={getEmailPlaceholder()}
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
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
              <AnimatedView style={[styles.inputGroup, input5Style]}>
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
                      placeholder="Create a password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      textContentType="newPassword"
                      autoComplete="password-new"
                      passwordRules="minlength: 6; required: lower; required: upper; required: digit;"
                    />
                    {password && !errors.password && password.length >= 6 && (
                      <View style={styles.inputIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                      </View>
                    )}
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
                </View>
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.passwordStrengthBar}>
                      {[1, 2, 3].map((level) => {
                        const passwordStrength = getPasswordStrength(password);
                        const isActive = level <= (passwordStrength.strength / 2);
                        return (
                          <View
                            key={level}
                            style={[
                              styles.passwordStrengthSegment,
                              isActive && {
                                backgroundColor: passwordStrength.color,
                              },
                            ]}
                          />
                        );
                      })}
                    </View>
                    <Text style={[styles.passwordStrengthText, { color: getPasswordStrength(password).color }]}>
                      {getPasswordStrength(password).label || 'Password strength'}
                    </Text>
                  </View>
                )}
                {errors.password ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{errors.password}</Text>
                  </View>
                ) : (
                  password.length > 0 && password.length < 6 && (
                    <View style={styles.passwordHint}>
                      <Text style={styles.passwordHintText}>
                        Password must be at least 6 characters
                      </Text>
                    </View>
                  )
                )}
              </AnimatedView>

              {/* Confirm Password */}
              <AnimatedView style={[styles.inputGroup, input6Style]}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'confirmPassword' ? '#22C55E' : '#94a3b8'} />
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputWithIcon,
                        styles.passwordInput,
                        errors.confirmPassword ? styles.inputError : null,
                        focusedInput === 'confirmPassword' ? styles.inputFocused : null,
                      ]}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setErrors({ ...errors, confirmPassword: '' });
                      }}
                      onFocus={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFocusedInput('confirmPassword');
                      }}
                      onBlur={() => setFocusedInput(null)}
                      placeholder="Confirm your password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showConfirmPassword}
                      textContentType="newPassword"
                      autoComplete="password-new"
                      passwordRules="minlength: 6; required: lower; required: upper; required: digit;"
                    />
                    {confirmPassword && !errors.confirmPassword && confirmPassword === password && password.length >= 6 && (
                      <View style={styles.inputIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                      </View>
                    )}
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const newValue = !showConfirmPassword;
                        setShowConfirmPassword(newValue);
                        // Rotate icon animation
                        confirmEyeIconRotation.value = withSpring(newValue ? 180 : 0, {
                          damping: 10,
                          stiffness: 200,
                        });
                      }}
                    >
                      <Animated.View style={confirmEyeIconStyle}>
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="#94a3b8"
                        />
                      </Animated.View>
                    </Pressable>
                  </View>
                </View>
                {errors.confirmPassword ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  </View>
                ) : (
                  confirmPassword.length > 0 && confirmPassword !== password && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#ef4444" />
                      <Text style={styles.errorText}>Passwords do not match</Text>
                    </View>
                  )
                )}
              </AnimatedView>

              {/* Terms and Privacy Policy Checkboxes */}
              <AnimatedView style={[styles.agreementContainer, checkboxesStyle]}>
                <View style={styles.checkboxRow}>
                  <Pressable
                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        acceptedTerms && styles.checkboxChecked,
                        !acceptedTerms && styles.checkboxUnchecked,
                      ]}
                    >
                      {acceptedTerms && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.checkboxTextContainer}
                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                  >
                    <Text style={styles.checkboxText}>
                      I agree to the{' '}
                      <Text
                        style={styles.linkText}
                        onPress={() => router.push('/terms-of-service')}
                      >
                        Terms of Service
                      </Text>
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.checkboxRow}>
                  <Pressable
                    onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        acceptedPrivacy && styles.checkboxChecked,
                        !acceptedPrivacy && styles.checkboxUnchecked,
                      ]}
                    >
                      {acceptedPrivacy && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.checkboxTextContainer}
                    onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                  >
                    <Text style={styles.checkboxText}>
                      I agree to the{' '}
                      <Text
                        style={styles.linkText}
                        onPress={() => router.push('/privacy-policy')}
                      >
                        Privacy Policy
                      </Text>
                    </Text>
                  </Pressable>
                </View>
              </AnimatedView>

              {/* Submit Button */}
              <AnimatedPressable 
                style={[
                  styles.submitButton,
                  (isLoading || !acceptedTerms || !acceptedPrivacy) && styles.submitButtonDisabled,
                  submitButtonStyle,
                ]} 
                onPress={handleSubmit}
                disabled={isLoading || !acceptedTerms || !acceptedPrivacy}
              >
                <LinearGradient
                  colors={['#22C55E', '#16A34A', '#15803D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.submitIcon} />
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#14532D',
    marginBottom: 10,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
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
  inputGroupWithDropdown: {
    marginBottom: 4,
    zIndex: 1000,
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
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    flex: 1,
    minHeight: 52,
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
    paddingRight: 48,
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -18 }],
    padding: 4,
    zIndex: 3,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
  passwordHint: {
    marginTop: 8,
    marginLeft: 4,
  },
  passwordHintText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  passwordStrengthContainer: {
    marginTop: 10,
    gap: 6,
  },
  passwordStrengthBar: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
  },
  passwordStrengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(220, 252, 231, 0.4)',
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  universityContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
    zIndex: 1001,
    borderWidth: 1.5,
    borderColor: 'rgba(220, 252, 231, 0.8)',
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 252, 231, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  submitButton: {
    borderRadius: 18,
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  submitIcon: {
    marginLeft: 4,
  },
  agreementContainer: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(240, 253, 244, 0.6)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(220, 252, 231, 0.5)',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  checkboxUnchecked: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(220, 252, 231, 0.6)',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    opacity: 0.9,
  },
  linkText: {
    color: '#22C55E',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

