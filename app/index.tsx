import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '@/context/UserContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Animated Pressable component with scale animation
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedView = Animated.View;

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();

  // Logo animations - scale, fade, and glow
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoGlow = useSharedValue(0);
  const swapIconTranslate = useSharedValue(0);
  
  // Title animations - fade and slide
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.9);
  const titleTranslateY = useSharedValue(20);
  
  // Button animations - staggered entrance
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(30);
  const primaryButtonScale = useSharedValue(1);
  const secondaryButtonScale = useSharedValue(1);
  const primaryIconTranslate = useSharedValue(0);
  const secondaryIconTranslate = useSharedValue(0);
  
  // Background animations - subtle color transition
  const backgroundColorPulse = useSharedValue(0);
  const floatingCircle1 = useSharedValue(0);
  const floatingCircle2 = useSharedValue(0);
  const floatingCircle3 = useSharedValue(0);
  const circle1Opacity = useSharedValue(0);
  const circle2Opacity = useSharedValue(0);
  const circle3Opacity = useSharedValue(0);
  
  // Footer animation
  const footerOpacity = useSharedValue(0);

  // Redirect authenticated users to tabs
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, router]);

  // Sophisticated entrance animations with staggered timing
  useEffect(() => {
    // Background color pulse - subtle light to dark transition
    backgroundColorPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Floating circles - smooth vertical floating with opacity variation
    floatingCircle1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    floatingCircle2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    floatingCircle3.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Circle opacity animations - fade in smoothly
    circle1Opacity.value = withTiming(0.08, { duration: 1500 });
    circle2Opacity.value = withTiming(0.06, { duration: 1800 });
    circle3Opacity.value = withTiming(0.1, { duration: 2000 });

    // Logo animation - scale and fade with glow effect
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 110,
      mass: 0.8,
    });
    logoOpacity.value = withTiming(1, { 
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    // Glow effect - subtle pulse
    logoGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Swap icon animation - left-right swap motion
    swapIconTranslate.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Title animation - staggered entrance (200ms delay)
    titleOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
    titleScale.value = withDelay(
      200,
      withSpring(1, {
        damping: 14,
        stiffness: 100,
        mass: 0.9,
      })
    );
    titleTranslateY.value = withDelay(
      200,
      withSpring(0, {
        damping: 16,
        stiffness: 90,
        mass: 1,
      })
    );

    // Buttons animation - staggered entrance (400ms delay after title)
    buttonsOpacity.value = withDelay(
      400,
      withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      })
    );
    buttonsTranslateY.value = withDelay(
      400,
      withSpring(0, {
        damping: 15,
        stiffness: 90,
        mass: 1,
      })
    );

    // Footer animation - fade in last (600ms delay)
    footerOpacity.value = withDelay(
      600,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);

  // Animated styles with interpolation and effects
  const logoAnimatedStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      logoGlow.value,
      [0, 1],
      [0.3, 0.6],
      Extrapolate.CLAMP
    );
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
      shadowOpacity: glowOpacity,
    };
  });

  const logoGlowStyle = useAnimatedStyle(() => {
    const glowSize = interpolate(
      logoGlow.value,
      [0, 1],
      [140, 160],
      Extrapolate.CLAMP
    );
    const glowOpacity = interpolate(
      logoGlow.value,
      [0, 1],
      [0.2, 0.4],
      Extrapolate.CLAMP
    );
    return {
      width: glowSize,
      height: glowSize,
      borderRadius: glowSize / 2,
      opacity: glowOpacity,
    };
  });

  const swapIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swapIconTranslate.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [
      { scale: titleScale.value },
      { translateY: titleTranslateY.value },
    ],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  // Background overlay animation for subtle color transition
  const backgroundOverlayStyle = useAnimatedStyle(() => {
    // Subtle overlay opacity - slowly transitions from transparent to slightly visible
    const overlayOpacity = interpolate(
      backgroundColorPulse.value,
      [0, 1],
      [0, 0.06],
      Extrapolate.CLAMP
    );
    return {
      opacity: overlayOpacity,
    };
  });

  const floatingCircle1Style = useAnimatedStyle(() => {
    const translateY = interpolate(
      floatingCircle1.value,
      [0, 1],
      [0, -35],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      floatingCircle1.value,
      [0, 0.5, 1],
      [circle1Opacity.value * 0.5, circle1Opacity.value, circle1Opacity.value * 0.5],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const floatingCircle2Style = useAnimatedStyle(() => {
    const translateY = interpolate(
      floatingCircle2.value,
      [0, 1],
      [0, -45],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      floatingCircle2.value,
      [0, 0.5, 1],
      [circle2Opacity.value * 0.5, circle2Opacity.value, circle2Opacity.value * 0.5],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const floatingCircle3Style = useAnimatedStyle(() => {
    const translateY = interpolate(
      floatingCircle3.value,
      [0, 1],
      [0, -30],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      floatingCircle3.value,
      [0, 0.5, 1],
      [circle3Opacity.value * 0.5, circle3Opacity.value, circle3Opacity.value * 0.5],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const primaryButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryButtonScale.value }],
  }));

  const secondaryButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: secondaryButtonScale.value }],
  }));

  const primaryIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: primaryIconTranslate.value }],
  }));

  const secondaryIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: secondaryIconTranslate.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  // Button press handlers with smooth animations and haptics
  const handlePrimaryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Scale down animation
    primaryButtonScale.value = withSequence(
      withSpring(0.96, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    // Arrow icon slides right
    primaryIconTranslate.value = withSequence(
      withSpring(6, { damping: 10, stiffness: 400 }),
      withSpring(0, { damping: 10, stiffness: 400 })
    );
    setTimeout(() => router.push('/create-account' as any), 120);
  };

  const handleSecondaryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Slight bounce animation
    secondaryButtonScale.value = withSequence(
      withSpring(0.97, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    // Icon bounces
    secondaryIconTranslate.value = withSequence(
      withSpring(4, { damping: 10, stiffness: 400 }),
      withSpring(0, { damping: 10, stiffness: 400 })
    );
    setTimeout(() => router.push('/login' as any), 100);
  };

  const handleAdminPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/admin/login' as any);
  };

  // Show loading state if checking authentication
  if (isLoading) {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#BBF7D0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#22C55E" />
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Animated background gradient - Eco-friendly green with subtle pulse */}
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Subtle overlay for smooth color transition - light to slightly darker */}
          <AnimatedView
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: '#15803D',
              },
              backgroundOverlayStyle,
            ]}
          />
        </View>

        {/* Floating decorative circles - Green tones with parallax */}
        <AnimatedView style={[styles.floatingCircle, styles.circle1, floatingCircle1Style]} />
        <AnimatedView style={[styles.floatingCircle, styles.circle2, floatingCircle2Style]} />
        <AnimatedView style={[styles.floatingCircle, styles.circle3, floatingCircle3Style]} />

        {/* Main content */}
        <View style={styles.content}>
          {/* Logo/Icon Section with glow effect */}
          <Animated.View style={styles.logoContainer}>
            {/* Glow effect behind logo */}
            <AnimatedView style={[styles.logoGlow, logoGlowStyle]} />
            <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
              <LinearGradient
                colors={['#FFFFFF', '#F0FDF4']}
                style={styles.logoCircle}
              >
                <View style={styles.logoInnerCircle}>
                  <LinearGradient
                    colors={['#22C55E', '#16A34A', '#15803D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                  >
                    <Animated.View style={swapIconAnimatedStyle}>
                      <Ionicons name="swap-horizontal" size={48} color="#FFFFFF" />
                    </Animated.View>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* Title Section */}
          <Animated.View style={titleAnimatedStyle}>
            <Text style={styles.title}>OnlySwap</Text>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle]}>
            {/* Primary Button - Create Account with animated arrow */}
            <AnimatedPressable
              style={[styles.createAccountButton, primaryButtonAnimatedStyle]}
              onPress={handlePrimaryPress}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A', '#15803D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.createAccountText}>Create Account</Text>
                <Animated.View style={primaryIconAnimatedStyle}>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </Animated.View>
              </LinearGradient>
            </AnimatedPressable>

            {/* Secondary Button - Login with animated icon */}
            <AnimatedPressable
              style={[styles.loginButton, secondaryButtonAnimatedStyle]}
              onPress={handleSecondaryPress}
            >
              <View style={styles.loginButtonInner}>
                <Text style={styles.loginText}>Login</Text>
                <Animated.View style={secondaryIconAnimatedStyle}>
                  <Ionicons name="log-in-outline" size={20} color="#22C55E" />
                </Animated.View>
              </View>
            </AnimatedPressable>

          </Animated.View>
        </View>

        {/* Footer - Minimal with fade-in */}
        <AnimatedView style={[styles.footer, footerAnimatedStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.adminLink,
              pressed && styles.linkPressed,
            ]}
            onPress={handleAdminPress}
          >
            <Text style={styles.adminLinkText}>Admin Login</Text>
          </Pressable>
          <Text style={styles.footerText}>© 2025 OnlySwap</Text>
        </AnimatedView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Floating decorative circles - Eco-friendly green tones
  floatingCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#22C55E',
    top: -100,
    right: -50,
    opacity: 0.08,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#16A34A',
    bottom: 100,
    left: -30,
    opacity: 0.06,
  },
  circle3: {
    width: 120,
    height: 120,
    backgroundColor: '#15803D',
    top: height * 0.3,
    right: width * 0.2,
    opacity: 0.1,
  },
  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: height * 0.08,
    paddingBottom: 60,
    zIndex: 1,
  },
  // Logo Section - Clean with glow effect
  logoContainer: {
    marginBottom: 56,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    elevation: 0,
  },
  logoWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  logoInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Typography - Enhanced with better spacing
  title: {
    fontSize: 58,
    fontWeight: '800',
    color: '#14532D',
    marginBottom: 72,
    textAlign: 'center',
    letterSpacing: -1.2,
    fontFamily: 'System',
    lineHeight: 64,
  },
  // Buttons Container
  buttonsContainer: {
    width: '100%',
    maxWidth: 420,
    gap: 14,
  },
  // Primary Button - Eco-friendly green
  createAccountButton: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  createAccountText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: 'System',
  },
  // Secondary Button - Clean outline
  loginButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonInner: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loginText: {
    color: '#22C55E',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: 'System',
  },
  // Admin Link
  adminLink: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adminLinkText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  // Button Press States
  linkPressed: {
    opacity: 0.6,
  },
  // Footer - Minimal
  footer: {
    paddingBottom: 32,
    paddingTop: 24,
    alignItems: 'center',
    zIndex: 1,
    gap: 8,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.3,
    fontFamily: 'System',
  },
});