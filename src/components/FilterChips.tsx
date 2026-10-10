import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { FeedFilterStatus } from '@/types/disaster';

interface FilterOption {
  key: FeedFilterStatus;
  label: string;
  count: number;
  dotColor?: string;
}

interface FilterChipsProps {
  selectedFilter: FeedFilterStatus;
  onSelectFilter: (filter: FeedFilterStatus) => void;
  counts: {
    total: number;
    active: number;
    candidate: number;
    resolved: number;
  };
}

export function FilterChips({
  selectedFilter,
  onSelectFilter,
  counts,
}: FilterChipsProps) {
  const { colors } = useTheme();

  const options: FilterOption[] = [
    {
      key: 'ALL',
      label: 'All',
      count: counts.total,
    },
    {
      key: 'ACTIVE',
      label: 'Active',
      count: counts.active,
      dotColor: colors.statusActive,
    },
    {
      key: 'CANDIDATE',
      label: 'Watch',
      count: counts.candidate,
      dotColor: colors.statusWatch,
    },
    {
      key: 'RESOLVED',
      label: 'Resolved',
      count: counts.resolved,
      dotColor: colors.statusResolved,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {options.map((opt) => {
          const isSelected = selectedFilter === opt.key;

          // YouTube style: selected chip is crisp contrast, unselected is surfaceMuted
          const chipBg = isSelected ? colors.chipActiveBg : colors.surfaceMuted;
          const textColor = isSelected ? colors.chipActiveText : colors.textPrimary;
          const countColor = isSelected ? colors.chipActiveText : colors.textSecondary;

          return (
            <Pressable
              hitSlop={{ top: spacing.sm, bottom: spacing.sm }}
              key={opt.key}
              onPress={() => onSelectFilter(opt.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Filter by ${opt.label}, ${opt.count} alerts`}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: chipBg,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              {opt.dotColor && (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isSelected ? colors.chipActiveText : opt.dotColor,
                    },
                  ]}
                />
              )}
              <Text style={[styles.label, { color: textColor }]}>{opt.label}</Text>
              <Text style={[styles.count, typography.tabular, { color: countColor }]}>
                {opt.count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
    alignItems: 'center',
    minHeight: touchTargets.min,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    minHeight: 36,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  label: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  count: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 16,
    marginLeft: 5,
    fontWeight: '500',
    opacity: 0.85,
  },
});
