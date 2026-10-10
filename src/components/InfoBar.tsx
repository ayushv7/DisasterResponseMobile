import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface InfoBarProps {
  isSampleData?: boolean;
  persistent?: boolean;
  customMessage?: string;
}

export function InfoBar({
  isSampleData = true,
  persistent = true,
  customMessage,
}: InfoBarProps) {
  const { colors } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  if (!isSampleData || (!persistent && isDismissed)) return null;

  const displayMessage =
    customMessage || 'SAMPLE DATA — NOT LIVE FLOOD INFORMATION';

  return (
    <>
      <View
        style={[styles.container, { backgroundColor: colors.infoBg }]}
        accessibilityRole="summary"
        accessibilityLabel={`Notice: ${displayMessage}`}>
        <View style={styles.contentRow}>
          <Feather name="info" size={15} color={colors.info} style={styles.icon} />
          <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={1}>
            {displayMessage}
          </Text>
          <Pressable
            onPress={() => setIsModalVisible(true)}
            hitSlop={spacing.sm}
            accessibilityRole="button"
            accessibilityLabel="Learn more about sample data">
            <Text style={[styles.learnMore, { color: colors.brandPrimary }]}>Learn more</Text>
          </Pressable>
        </View>

        {!persistent && (
          <Pressable
            onPress={() => setIsDismissed(true)}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Dismiss sample data notice"
            hitSlop={spacing.xs}>
            <Feather name="x" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Explanatory Bottom Modal / Sheet */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Data Provenance & Status
              </Text>
              <Pressable
                onPress={() => setIsModalVisible(false)}
                hitSlop={spacing.sm}
                accessibilityRole="button"
                accessibilityLabel="Close info modal">
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
              This mobile client is currently displaying simulation fixtures for interface evaluation.
            </Text>
            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
              In live deployment, all observations are ingested automatically from official government agencies (such as Central Water Commission and IMD) and verified NGO telemetry. No synthetic information will ever be presented as verified events.
            </Text>

            <Pressable
              onPress={() => setIsModalVisible(false)}
              style={[styles.modalAction, { backgroundColor: colors.brandPrimary }]}
              accessibilityRole="button"
              accessibilityLabel="Dismiss dialog">
              <Text style={[styles.modalActionText, { color: colors.onPrimary }]}>Understood</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 10,
    minHeight: 40,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    ...typography.caption,
    flexShrink: 1,
  },
  learnMore: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
    textDecorationLine: 'underline',
  },
  dismissButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radii.card,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.cardTitle,
  },
  modalBody: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  modalAction: {
    height: touchTargets.min,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  modalActionText: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
});
