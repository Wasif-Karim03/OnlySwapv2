import { reportEntity } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    reportedUserId?: string;
    reportedProductId?: string;
    title?: string; // Optional title override
}

const REPORT_REASONS = [
    { id: 'inappropriate_content', label: 'Inappropriate Content' },
    { id: 'spam', label: 'Spam or Scam' },
    { id: 'harassment', label: 'Harassment' },
    { id: 'offensive_language', label: 'Offensive Language' },
    { id: 'fake_profile', label: 'Fake Profile/Item' },
    { id: 'other', label: 'Other' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
    visible,
    onClose,
    reportedUserId,
    reportedProductId,
    title,
}) => {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) {
            Alert.alert('Error', 'Please select a reason for reporting.');
            return;
        }

        setIsSubmitting(true);

        try {
            await reportEntity({
                reportedUser: reportedUserId,
                reportedProduct: reportedProductId,
                reason: selectedReason,
                description,
            });

            Alert.alert(
                'Report Submitted',
                'Thank you for your report. We will review it shortly.',
                [{ text: 'OK', onPress: onClose }]
            );

            // Reset form
            setSelectedReason(null);
            setDescription('');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to submit report. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <Text style={styles.title}>{title || 'Report Issue'}</Text>
                                <Pressable onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </Pressable>
                            </View>

                            <Text style={styles.subtitle}>
                                Why are you reporting this?
                            </Text>

                            <View style={styles.reasonsContainer}>
                                {REPORT_REASONS.map((reason) => (
                                    <Pressable
                                        key={reason.id}
                                        style={[
                                            styles.reasonOption,
                                            selectedReason === reason.id && styles.reasonOptionSelected,
                                        ]}
                                        onPress={() => setSelectedReason(reason.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.reasonText,
                                                selectedReason === reason.id && styles.reasonTextSelected,
                                            ]}
                                        >
                                            {reason.label}
                                        </Text>
                                        {selectedReason === reason.id && (
                                            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                        )}
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={styles.label}>Additional Details (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Please provide more details..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                maxLength={500}
                                textAlignVertical="top"
                            />

                            <Pressable
                                style={[
                                    styles.submitButton,
                                    (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={!selectedReason || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Report</Text>
                                )}
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        width: '100%',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 12,
    },
    reasonsContainer: {
        marginBottom: 20,
    },
    reasonOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 8,
        backgroundColor: '#F8FAFC',
    },
    reasonOptionSelected: {
        borderColor: '#22C55E',
        backgroundColor: '#F0FDF4',
    },
    reasonText: {
        fontSize: 15,
        color: '#475569',
    },
    reasonTextSelected: {
        color: '#166534',
        fontWeight: '600',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        height: 100,
        fontSize: 15,
        color: '#334155',
        marginBottom: 24,
    },
    submitButton: {
        backgroundColor: '#EF4444', // Red for reporting action
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#FDA4AF',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
