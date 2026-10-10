/**
 * Toast: a short confirmation after a successful action (not used for errors,
 * which stay on screen until handled). One at a time; hides after 3 seconds.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, spacing, textScale, touchTargets, typography, useTheme } from '@/theme';

const ToastContext = createContext<((message: string) => void) | null>(null);

const SHOW_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), SHOW_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message && (
        <View
          pointerEvents="none"
          style={[
            styles.toast,
            // Above the bottom tab bars
            { backgroundColor: colors.textPrimary, bottom: insets.bottom + touchTargets.min + spacing.xxl },
          ]}
          accessibilityLiveRegion="polite">
          <Feather name="check" size={16} color={colors.background} />
          <Text style={[styles.text, { color: colors.background }]} numberOfLines={3}>
            {message}
          </Text>
        </View>
      )}
    </ToastContext.Provider>
  );
}

/** `toast('Saved')`. Falls back to a no-op outside the provider. */
export function useToast() {
  return useContext(ToastContext) ?? (() => {});
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  text: { ...typography.body, ...textScale.body, flex: 1 },
});
