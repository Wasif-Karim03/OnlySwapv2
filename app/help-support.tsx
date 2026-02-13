import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@/context/UserContext';
import api from '@/services/api';

export default function HelpSupportScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [reportType, setReportType] = useState<'bug' | 'user' | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [reportedUserId, setReportedUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSupport = () => {
    const email = 'onlyswapwck@gmail.com';
    const subject = encodeURIComponent('OnlySwap Support Request');
    const body = encodeURIComponent(
      `Hello OnlySwap Support Team,\n\n` +
      `User: ${user?.firstName} ${user?.lastName}\n` +
      `Email: ${user?.email}\n` +
      `University: ${user?.university}\n\n` +
      `I need help with:\n\n`
    );
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          'Email Not Available',
          'Please send an email to onlyswapwck@gmail.com with your support request.',
          [{ text: 'OK' }]
        );
      }
    });
  };

  const handleReportBug = () => {
    setReportType('bug');
    setSubject('');
    setDescription('');
    setReportedUserId('');
  };

  const handleReportUser = () => {
    setReportType('user');
    setSubject('');
    setDescription('');
    setReportedUserId('');
  };

  const handleSubmitReport = async () => {
    if (!subject.trim()) {
      Alert.alert('Required Field', 'Please enter a subject.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Required Field', 'Please enter a description.');
      return;
    }

    if (reportType === 'user' && !reportedUserId.trim()) {
      Alert.alert('Required Field', 'Please enter the user ID or username of the user you want to report.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = reportType === 'bug' ? '/api/support/report-bug' : '/api/support/report-user';
      const payload: any = {
        subject: subject.trim(),
        description: description.trim(),
      };

      if (reportType === 'user') {
        payload.reportedUserId = reportedUserId.trim();
      }

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        Alert.alert(
          'Report Submitted',
          reportType === 'bug'
            ? 'Thank you for reporting this bug. Our team will review it shortly.'
            : 'Thank you for your report. We will investigate this user and take appropriate action.',
          [
            {
              text: 'OK',
              onPress: () => {
                setReportType(null);
                setSubject('');
                setDescription('');
                setReportedUserId('');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to submit report. Please try again or email us at onlyswapwck@gmail.com'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReportType(null);
    setSubject('');
    setDescription('');
    setReportedUserId('');
  };

  if (reportType) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {reportType === 'bug' ? 'Report a Bug' : 'Report a User'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.formDescription}>
              {reportType === 'bug'
                ? 'Please describe the bug you encountered. Include details about what you were doing when it happened.'
                : 'Please describe the issue with this user. All reports are reviewed by our team.'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief summary of the issue"
                placeholderTextColor="#9CA3AF"
                editable={!isSubmitting}
              />
            </View>

            {reportType === 'user' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>User ID, Email, or Name *</Text>
                <TextInput
                  style={styles.input}
                  value={reportedUserId}
                  onChangeText={setReportedUserId}
                  placeholder="Enter user ID, email, or name"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSubmitting}
                  autoCapitalize="none"
                />
                <Text style={styles.hintText}>
                  You can enter the user's ID, email address, or their first/last name
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={
                  reportType === 'bug'
                    ? 'Describe the bug in detail...'
                    : 'Describe the issue with this user...'
                }
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            <Pressable
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitReport}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <LinearGradient
                  colors={['#6cc27a', '#4caf50']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <Pressable style={styles.menuItem} onPress={handleEmailSupport}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#f0f9ff' }]}>
                <Ionicons name="mail-outline" size={20} color="#0ea5e9" />
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.menuItemText}>Email Support</Text>
                <Text style={styles.menuItemSubtext}>onlyswapwck@gmail.com</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleReportBug}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fff7ed' }]}>
                <Ionicons name="bug-outline" size={20} color="#f59e0b" />
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.menuItemText}>Report a Bug</Text>
                <Text style={styles.menuItemSubtext}>Found an issue? Let us know</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleReportUser}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="person-remove-outline" size={20} color="#ef4444" />
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.menuItemText}>Report a User</Text>
                <Text style={styles.menuItemSubtext}>Report inappropriate behavior</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </Pressable>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#4caf50" />
            <Text style={styles.infoText}>
              All reports are reviewed by our support team. We typically respond within 24-48 hours.
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
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b6b6b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuItemSubtext: {
    fontSize: 13,
    color: '#6b6b6b',
    marginTop: 2,
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f7fdf9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6b6b6b',
    lineHeight: 20,
  },
  formContainer: {
    padding: 20,
  },
  formDescription: {
    fontSize: 14,
    color: '#6b6b6b',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  hintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  submitButton: {
    width: '100%',
    marginTop: 8,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

