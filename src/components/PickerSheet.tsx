import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export interface PickerItem {
  id: string;
  title: string;
  subtitle?: string;
  /** Short label, e.g. "Volunteer". */
  tag?: string;
}

/** Bottom sheet listing items to pick one (workers for a task, or tasks for a worker). */
export function PickerSheet({
  visible,
  title,
  note,
  items,
  loading,
  busyId,
  emptyText,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  note?: string;
  items: PickerItem[];
  loading?: boolean;
  busyId?: string | null;
  emptyText: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {note && <Text style={[styles.caption, { color: colors.textSecondary }]}>{note}</Text>}
        {loading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : items.length === 0 ? (
          <Text style={[styles.caption, { color: colors.textSecondary }]}>{emptyText}</Text>
        ) : (
          <ScrollView style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onPick(item.id)}
                disabled={!!busyId}
                style={[styles.row, { backgroundColor: colors.surfaceMuted }]}
                accessibilityRole="button">
                <View style={styles.flex}>
                  <Text style={[styles.body, { color: colors.textPrimary }]}>
                    {item.title}
                    {item.tag ? ` · ${item.tag}` : ''}
                  </Text>
                  {item.subtitle && (
                    <Text style={[styles.caption, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                  )}
                </View>
                {busyId === item.id && <ActivityIndicator size="small" color={colors.textTertiary} />}
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <Text style={[styles.body, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: spacing.screenPadding,
    gap: spacing.sm,
    maxHeight: '70%',
  },
  title: { ...typography.title, fontSize: 18 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
  },
  flex: { flex: 1 },
  body: { ...typography.body, fontSize: 14, lineHeight: 20 },
  caption: { ...typography.caption, fontSize: 12, lineHeight: 17 },
  cancel: { minHeight: touchTargets.min, alignItems: 'center', justifyContent: 'center' },
});
