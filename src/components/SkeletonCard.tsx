import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/spacing';

export function SkeletonCard() {
  const { colors } = useTheme();
  const opacityAnimRef = useRef(new Animated.Value(0.4));

  useEffect(() => {
    const anim = opacityAnimRef.current;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
        },
      ]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <Animated.View
          style={[
            styles.statusPill,
            { backgroundColor: colors.surfaceMuted, opacity: opacityAnimRef.current },
          ]}
        />
        <Animated.View
          style={[
            styles.timeBox,
            { backgroundColor: colors.surfaceMuted, opacity: opacityAnimRef.current },
          ]}
        />
      </View>

      {/* Title lines */}
      <Animated.View
        style={[
          styles.titleLine1,
          { backgroundColor: colors.surfaceMuted, opacity: opacityAnimRef.current },
        ]}
      />
      <Animated.View
        style={[
          styles.titleLine2,
          { backgroundColor: colors.surfaceMuted, opacity: opacityAnimRef.current },
        ]}
      />

      {/* Location line */}
      <Animated.View
        style={[
          styles.locationLine,
          { backgroundColor: colors.surfaceMuted, opacity: opacityAnimRef.current },
        ]}
      />

      {/* Summary lines */}
      <Animated.View
        style={[
          styles.summaryLine,
          { backgroundColor: colors.surfaceMuted, opacity: opacityAnimRef.current },
        ]}
      />

      {/* Footer line */}
      <View style={styles.footerRow}>
        <Animated.View
          style={[
            styles.footerLine,
            { backgroundColor: colors.surfaceMuted, opacity: opacityAnimRef.current },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.cardGap,
    minHeight: 180,
    // Flat surface without borders or shadows
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusPill: {
    width: 68,
    height: 22,
    borderRadius: radii.chip,
  },
  timeBox: {
    width: 48,
    height: 16,
    borderRadius: 4,
  },
  titleLine1: {
    width: '88%',
    height: 18,
    borderRadius: 4,
    marginBottom: 6,
  },
  titleLine2: {
    width: '60%',
    height: 18,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  locationLine: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  summaryLine: {
    width: '100%',
    height: 32,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  footerRow: {
    paddingTop: spacing.xs,
  },
  footerLine: {
    width: '50%',
    height: 14,
    borderRadius: 4,
  },
});
