import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const effectiveDate = 'January 15, 2025';
  const lastUpdated = 'January 15, 2025';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>PRIVACY POLICY</Text>
          
          <Text style={styles.metaText}>
            Effective Date: {effectiveDate}
          </Text>
          <Text style={styles.metaText}>
            Last Updated: {lastUpdated}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              OnlySwap ("we," "our," or "us") respects your privacy.
            </Text>
            <Text style={styles.paragraph}>
              This Privacy Policy explains how we collect, use, disclose, and protect your information when you use the OnlySwap mobile app or website (the "Platform").
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            
            <Text style={styles.subsectionTitle}>2.1 Information You Provide</Text>
            <Text style={styles.listItem}>• First and last name</Text>
            <Text style={styles.listItem}>• University name</Text>
            <Text style={styles.listItem}>• Verified .edu email address</Text>
            <Text style={styles.listItem}>• Password (hashed)</Text>
            <Text style={styles.listItem}>• Profile picture (optional)</Text>
            <Text style={styles.listItem}>• Listings, bids, chat messages, and other content you create</Text>

            <Text style={styles.subsectionTitle}>2.2 Automatically Collected Information</Text>
            <Text style={styles.listItem}>• Device identifiers and technical data (app version, OS)</Text>
            <Text style={styles.listItem}>• Swipe and usage analytics (views, interactions)</Text>
            <Text style={styles.listItem}>• Login timestamps and IP addresses (for security)</Text>

            <Text style={styles.subsectionTitle}>2.3 Third-Party Service Data</Text>
            <Text style={styles.paragraph}>
              We use:
            </Text>
            <Text style={styles.listItem}>• Expo for app distribution and diagnostics</Text>
            <Text style={styles.listItem}>• Socket.IO for real-time chat messaging</Text>
            <Text style={styles.listItem}>• Gmail SMTP for sending verification and notification emails</Text>
            <Text style={styles.paragraph}>
              These providers process limited personal data solely to deliver their services.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              We use information to:
            </Text>
            <Text style={styles.listItem}>• Operate and maintain the Platform;</Text>
            <Text style={styles.listItem}>• Facilitate user-to-user communication and listings;</Text>
            <Text style={styles.listItem}>• Send notifications, verification codes, and support messages;</Text>
            <Text style={styles.listItem}>• Improve functionality, security, and analytics;</Text>
            <Text style={styles.listItem}>• Prevent fraud, abuse, or unauthorized access; and</Text>
            <Text style={styles.listItem}>• Comply with legal obligations.</Text>
            <Text style={styles.paragraph}>
              We do not sell personal information to third parties.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
            <Text style={styles.paragraph}>
              Data is stored in MongoDB databases and secure server directories in the United States.
            </Text>
            <Text style={styles.paragraph}>
              Passwords are bcrypt-hashed and never stored in plain text.
            </Text>
            <Text style={styles.paragraph}>
              All communications occur over HTTPS/WSS.
            </Text>
            <Text style={styles.paragraph}>
              Tokens are stored securely on your device using AsyncStorage.
            </Text>
            <Text style={styles.paragraph}>
              Despite our safeguards, no system is completely secure; you use the Platform at your own risk.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Data Retention and Deletion</Text>
            <Text style={styles.paragraph}>
              Data is retained while your account is active.
            </Text>
            <Text style={styles.paragraph}>
              Upon deletion, account data, listings, bids, and messages are removed or anonymized within a reasonable period, except where retention is required by law (e.g., support or legal compliance records).
            </Text>
            <Text style={styles.paragraph}>
              Support tickets may be retained for compliance.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Sharing and Disclosure</Text>
            <Text style={styles.paragraph}>
              We may share information:
            </Text>
            <Text style={styles.listItem}>• With service providers (Expo, Socket.IO, Gmail SMTP) strictly for operational purposes;</Text>
            <Text style={styles.listItem}>• To comply with law, subpoenas, or enforceable government requests;</Text>
            <Text style={styles.listItem}>• To protect rights, safety, or security of users and the Platform.</Text>
            <Text style={styles.paragraph}>
              We do not share user data for advertising or marketing purposes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. User Rights and Controls</Text>
            <Text style={styles.paragraph}>
              Depending on your jurisdiction (e.g., CCPA / GDPR readiness):
            </Text>
            <Text style={styles.listItem}>• Access: Request a copy of your personal data.</Text>
            <Text style={styles.listItem}>• Correction: Update or correct inaccurate data.</Text>
            <Text style={styles.listItem}>• Deletion: Request deletion of your account and associated data.</Text>
            <Text style={styles.listItem}>• Restriction/Opt-Out: Limit or object to certain data uses.</Text>
            <Text style={styles.paragraph}>
              Submit requests to onlyswapwck@gmail.com. We will verify identity before fulfilling requests.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Children's Privacy (COPPA)</Text>
            <Text style={styles.paragraph}>
              OnlySwap is not intended for children under 13.
            </Text>
            <Text style={styles.paragraph}>
              We do not knowingly collect personal data from minors.
            </Text>
            <Text style={styles.paragraph}>
              If we learn a child under 13 has provided information, we will promptly delete it.
            </Text>
            <Text style={styles.paragraph}>
              Users under 18 must have permission from a parent or guardian.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Data Transfers</Text>
            <Text style={styles.paragraph}>
              All data is currently stored in and processed from servers located in the United States.
            </Text>
            <Text style={styles.paragraph}>
              If accessed from other jurisdictions, you consent to data transfer and processing in the U.S.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy periodically.
            </Text>
            <Text style={styles.paragraph}>
              Material changes will be announced within the app or via email. Continued use of the Platform constitutes acceptance of the updated policy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Information</Text>
            <Text style={styles.paragraph}>
              For privacy questions, access, or deletion requests:
            </Text>
            <Text style={styles.paragraph}>
              Email: onlyswapwck@gmail.com
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2025 OnlySwap. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#6b6b6b',
    marginBottom: 8,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 8,
    marginLeft: 8,
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

