import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { TaskEvent } from '@/types/operations';

const LABELS: Record<TaskEvent['type'], string> = {
  ASSIGNED: 'Assigned',
  ACKNOWLEDGED: 'Acknowledged',
  STARTED: 'Started',
  PROBLEM_REPORTED: 'Problem reported',
  COMPLETED: 'Completion submitted',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected, reopened',
  REASSIGNED: 'Reassigned',
};

/** Collapsed one-line history; tap to see every event. */
export function TaskHistory({ history }: { history?: TaskEvent[] }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  if (!history || history.length === 0) return null;
  const last = history[history.length - 1];
  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`History, ${history.length} events`}>
        <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={1}>
          History ({history.length}) · {LABELS[last.type]} {time(last.at)}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
      </Pressable>
      {open &&
        history.map((event, idx) => (
          <Text key={idx} style={[styles.text, styles.row, { color: colors.textSecondary }]}>
            {time(event.at)} · {LABELS[event.type]} · {event.actor}
            {event.note ? ` · ${event.note}` : ''}
          </Text>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTargets.min,
    gap: spacing.sm,
  },
  text: {
    ...typography.caption,
    fontSize: 12,
    flexShrink: 1,
  },
  row: {
    paddingVertical: spacing.xxs,
  },
});
