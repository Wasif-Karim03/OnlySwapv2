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

export default function TermsOfServiceScreen() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>TERMS OF SERVICE</Text>
          
          <Text style={styles.metaText}>
            Effective Date: {effectiveDate}
          </Text>
          <Text style={styles.metaText}>
            Last Updated: {lastUpdated}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              Welcome to OnlySwap ("OnlySwap," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the OnlySwap mobile application, website, and related services (collectively, the "Platform").
            </Text>
            <Text style={styles.paragraph}>
              By creating an account or using the Platform, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Platform.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Nature of the Platform</Text>
            <Text style={styles.paragraph}>
              OnlySwap provides a peer-to-peer marketplace designed for university students to list, browse, and exchange goods within their university community.
            </Text>
            <Text style={styles.paragraph}>
              OnlySwap is a facilitator only—we do not buy, sell, own, inspect, store, ship, or guarantee any items listed by users. We do not process payments or provide escrow. All transactions occur directly between users at their own risk.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Eligibility</Text>
            <Text style={styles.paragraph}>
              You must be at least 16 years old and a verified university student with a valid .edu email address.
            </Text>
            <Text style={styles.paragraph}>
              By registering, you represent that all information you provide is true and accurate.
            </Text>
            <Text style={styles.paragraph}>
              Accounts are personal and non-transferable.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Account Registration and Security</Text>
            <Text style={styles.paragraph}>
              Users must register using their university email and maintain the confidentiality of their login credentials.
            </Text>
            <Text style={styles.paragraph}>
              You agree to:
            </Text>
            <Text style={styles.listItem}>• Maintain accurate profile information.</Text>
            <Text style={styles.listItem}>• Immediately notify OnlySwap of unauthorized use or breach of security.</Text>
            <Text style={styles.paragraph}>
              OnlySwap is not liable for any loss or damage resulting from your failure to secure your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. User Responsibilities</Text>
            <Text style={styles.paragraph}>
              You are solely responsible for:
            </Text>
            <Text style={styles.listItem}>• The accuracy of listings and communications;</Text>
            <Text style={styles.listItem}>• Negotiating and completing transactions;</Text>
            <Text style={styles.listItem}>• Ensuring compliance with local, state, and federal law;</Text>
            <Text style={styles.listItem}>• Arranging payment and delivery directly with the other user.</Text>
            <Text style={styles.paragraph}>
              OnlySwap does not mediate disputes or verify product quality, authenticity, or ownership.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Prohibited Conduct</Text>
            <Text style={styles.paragraph}>
              You may not use the Platform to:
            </Text>
            <Text style={styles.listItem}>• Post or sell prohibited, illegal, counterfeit, or stolen items (including but not limited to weapons, drugs, alcohol, animals, hazardous materials, or items requiring a license).</Text>
            <Text style={styles.listItem}>• Engage in harassment, spam, or fraud.</Text>
            <Text style={styles.listItem}>• Impersonate others or misrepresent your affiliation.</Text>
            <Text style={styles.listItem}>• Use automated tools, bots, or scripts.</Text>
            <Text style={styles.listItem}>• Interfere with or disrupt the Platform's operation.</Text>
            <Text style={styles.paragraph}>
              Violation of these rules may result in immediate account suspension or termination.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. User-Generated Content</Text>
            <Text style={styles.paragraph}>
              Users may upload listings, descriptions, and images ("User Content").
            </Text>
            <Text style={styles.paragraph}>
              You retain ownership of your content.
            </Text>
            <Text style={styles.paragraph}>
              By posting, you grant OnlySwap a non-exclusive, royalty-free, worldwide license to host, display, and transmit your content for Platform operation.
            </Text>
            <Text style={styles.paragraph}>
              You represent that you have all necessary rights and that your content does not infringe any third-party rights.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
            <Text style={styles.paragraph}>
              All intellectual property in the Platform—including code, design, logos, and trademarks—belongs to OnlySwap or its licensors.
            </Text>
            <Text style={styles.paragraph}>
              You may not copy, modify, distribute, or reverse-engineer any part of the Platform except as expressly permitted by law.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Transactions and Disputes</Text>
            <Text style={styles.paragraph}>
              All transactions occur directly between users.
            </Text>
            <Text style={styles.paragraph}>
              OnlySwap:
            </Text>
            <Text style={styles.listItem}>• Does not process payments;</Text>
            <Text style={styles.listItem}>• Does not guarantee the quality, safety, legality, or delivery of any item;</Text>
            <Text style={styles.listItem}>• Is not responsible for user-to-user disputes.</Text>
            <Text style={styles.paragraph}>
              Users must resolve any disputes independently. OnlySwap may, at its discretion, assist in moderation but is not obligated to do so.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Disclaimers</Text>
            <Text style={styles.paragraph}>
              The Platform is provided "as is" and "as available."
            </Text>
            <Text style={styles.paragraph}>
              OnlySwap makes no warranties, express or implied, regarding:
            </Text>
            <Text style={styles.listItem}>• Availability, reliability, or accuracy of the Platform;</Text>
            <Text style={styles.listItem}>• Any listings, products, or services offered by users;</Text>
            <Text style={styles.listItem}>• Freedom from errors, viruses, or interruptions.</Text>
            <Text style={styles.paragraph}>
              Use of the Platform is at your own risk.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              To the fullest extent permitted by law:
            </Text>
            <Text style={styles.paragraph}>
              OnlySwap's total liability to you for any claim shall not exceed the amount you paid to us (currently $0).
            </Text>
            <Text style={styles.paragraph}>
              OnlySwap shall not be liable for any indirect, incidental, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the Platform.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Indemnification</Text>
            <Text style={styles.paragraph}>
              You agree to indemnify and hold harmless OnlySwap, its officers, employees, and affiliates from any claim, loss, liability, or expense (including reasonable attorneys' fees) arising out of:
            </Text>
            <Text style={styles.listItem}>• Your use of the Platform;</Text>
            <Text style={styles.listItem}>• Violation of these Terms; or</Text>
            <Text style={styles.listItem}>• Infringement of any third-party rights.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. Termination</Text>
            <Text style={styles.paragraph}>
              By User: You may delete your account at any time.
            </Text>
            <Text style={styles.paragraph}>
              By OnlySwap: We may suspend or terminate accounts for violation of these Terms, suspected fraud, or security concerns.
            </Text>
            <Text style={styles.paragraph}>
              Termination may result in deletion or anonymization of your data per our Privacy Policy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>14. Governing Law and Dispute Resolution</Text>
            <Text style={styles.paragraph}>
              These Terms shall be governed by the laws of [Insert State], without regard to conflict-of-law principles.
            </Text>
            <Text style={styles.paragraph}>
              Any dispute shall be resolved exclusively in the state or federal courts located in [Insert Jurisdiction].
            </Text>
            <Text style={styles.paragraph}>
              You agree to the personal jurisdiction of those courts.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>15. Modifications</Text>
            <Text style={styles.paragraph}>
              We may modify these Terms from time to time.
            </Text>
            <Text style={styles.paragraph}>
              Changes take effect upon posting, and continued use of the Platform constitutes acceptance of the revised Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>16. Contact Information</Text>
            <Text style={styles.paragraph}>
              For legal or user support inquiries:
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

