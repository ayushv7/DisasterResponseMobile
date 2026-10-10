import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChipTone, StatusChip } from '@/components/StatusChip';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ActionQueueItem, ActionQueueReason } from '@/types/operations';

const REASONS: Record<ActionQueueReason, { label: string; tone: ChipTone; action: string }> = {
  FAILED: { label: 'Failed', tone: 'critical', action: 'Replan' },
  BLOCKED: { label: 'Blocked', tone: 'critical', action: 'Replan' },
  OVERDUE_ACK: { label: 'Ack overdue', tone: 'warning', action: 'Review' },
  UNASSIGNED: { label: 'Unassigned', tone: 'warning', action: 'Assign' },
  NEEDS_VERIFICATION: { label: 'Needs sign-off', tone: 'info', action: 'Verify' },
};

export function actionLabelFor(reason: ActionQueueReason) {
  return REASONS[reason].action;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ActionQueueCardProps {
  item: ActionQueueItem;
  /** The most urgent item gets the screen's one filled primary button. */
  isTop: boolean;
  onAction: () => void;
}

/** Action-oriented card: state chip, title, due time, one action. */
export function ActionQueueCard({ item, isTop, onAction }: ActionQueueCardProps) {
  const { colors } = useTheme();
  const reason = REASONS[item.reason];
  const due =
    item.dueAt &&
    (item.reason === 'OVERDUE_ACK' ? `Ack was due ${formatTime(item.dueAt)}` : `Due ${formatTime(item.dueAt)}`);

  return (
    <Pressable
      onPress={onAction}
      style={[styles.card, { backgroundColor: colors.surface }]}
      android_ripple={{ color: colors.surfaceMuted }}
      accessibilityRole="button"
      accessibilityLabel={`${reason.label}: ${item.title}, ${item.locality}. ${reason.action}.`}>
      <View style={styles.body}>
        <StatusChip label={reason.label} tone={reason.tone} />
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.title} · {item.locality}
        </Text>
        {(item.detail || due) && (
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.detail ?? due}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.action,
          isTop && { backgroundColor: colors.actionPrimary },
        ]}>
        <Text
          style={[
            styles.actionText,
            { color: isTop ? colors.onActionPrimary : colors.actionPrimary },
          ]}>
          {reason.action}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 15,
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
  },
  action: {
    minHeight: touchTargets.min,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
  },
});
