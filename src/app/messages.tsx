/**
 * MessagesScreen — Public user's sent private messages.
 *
 * Shows a chronological list of messages the user has sent to verified NGOs.
 * All statuses are server-provided. The client does not infer delivery,
 * verification, or any state transitions.
 *
 * BACKEND STATUS (Oct 2026): UI-only stub. See messages-list-api.ts.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BottomNavBar } from '@/components/BottomNavBar';
import { SampleDataBadge } from '@/components/SampleDataBadge';
import { IS_MESSAGES_STUB, fetchSentMessages } from '@/services/messages-list-api';
import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { MessageStatus, MessagesUiState, SentMessage } from '@/types/message-thread';

// ─── Status display config ──────────────────────────────────────────────────

interface StatusDisplayConfig {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  colorKey: 'brandPrimary' | 'statusWatch' | 'statusActive' | 'statusResolved' | 'textTertiary';
}

const STATUS_CONFIG: Record<MessageStatus, StatusDisplayConfig> = {
  SENT: {
    label: 'Sent',
    icon: 'check',
    colorKey: 'textTertiary',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: 'check-circle',
    colorKey: 'brandPrimary',
  },
  NGO_REVIEWING: {
    label: 'NGO Reviewing',
    icon: 'eye',
    colorKey: 'brandPrimary',
  },
  CLARIFICATION_REQUESTED: {
    label: 'Clarification Needed',
    icon: 'alert-circle',
    colorKey: 'statusWatch',
  },
  CLOSED: {
    label: 'Closed',
    icon: 'archive',
    colorKey: 'textTertiary',
  },
};

// ─── Main component ─────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const { colors } = useTheme();

  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [uiState, setUiState] = useState<MessagesUiState>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMessages = async () => {
    try {
      const list = await fetchSentMessages();
      setMessages(list);
      setUiState('success');
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to load messages.'
      );
      setUiState('error');
    }
  };

  useEffect(() => {
    (async () => {
      setUiState('loading');
      await loadMessages();
    })();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMessages();
    setIsRefreshing(false);
  };

  const handleRetry = () => {
    setUiState('loading');
    loadMessages();
  };

  const formatTime = (iso: string): string => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const handleMessagePress = (msg: SentMessage) => {
    // Navigate to the event detail for now — message detail screen is a future task
    router.push({
      pathname: '/event/[id]',
      params: { id: msg.eventId },
    });
  };

  // ─── Empty state ────────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Feather name="message-square" size={28} color={colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No messages yet
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
        Messages you send to verified NGOs, with photos or location, will appear here.
      </Text>
      <Pressable
        onPress={() => router.replace('/alerts')}
        style={({ pressed }) => [
          styles.emptyAction,
          {
            backgroundColor: colors.surfaceMuted,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go to flood alerts feed">
        <Text style={[styles.emptyActionText, { color: colors.brandPrimary }]}>
          Browse Flood Alerts
        </Text>
      </Pressable>
    </View>
  );

  // ─── Error state ────────────────────────────────────────────────────────

  const renderError = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.statusActiveBg }]}>
        <Feather name="wifi-off" size={28} color={colors.statusActive} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        Unable to load messages
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
        {errorMsg || 'Please check your connection and try again.'}
      </Text>
      <Pressable
        onPress={handleRetry}
        style={({ pressed }) => [
          styles.emptyAction,
          {
            backgroundColor: colors.surfaceMuted,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Retry loading messages">
        <Text style={[styles.emptyActionText, { color: colors.brandPrimary }]}>
          Retry
        </Text>
      </Pressable>
    </View>
  );

  // ─── Loading state ──────────────────────────────────────────────────────

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color={colors.brandPrimary} size="small" />
      <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
        Loading messages…
      </Text>
    </View>
  );

  // ─── Message row ────────────────────────────────────────────────────────

  const renderMessageRow = (msg: SentMessage) => {
    const config = STATUS_CONFIG[msg.status];
    const statusColor = colors[config.colorKey];

    return (
      <Pressable
        key={msg.messageId}
        onPress={() => handleMessagePress(msg)}
        android_ripple={{ color: colors.surfaceMuted }}
        accessibilityRole="button"
        accessibilityLabel={`Message to ${msg.ngoName} about ${msg.eventTitle}. Status: ${config.label}`}
        style={({ pressed }) => [
          styles.messageRow,
          {
            backgroundColor: colors.surface,
            opacity: pressed ? 0.94 : 1,
          },
        ]}>
        {/* Top: Status + Time */}
        <View style={styles.rowHeader}>
          <View style={styles.statusGroup}>
            <Feather name={config.icon} size={13} color={statusColor} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {config.label}
            </Text>
          </View>
          <Text style={[styles.timeText, typography.tabular, { color: colors.textTertiary }]}>
            {formatTime(msg.sentAt)}
          </Text>
        </View>

        {/* NGO name */}
        <Text style={[styles.ngoName, { color: colors.textPrimary }]} numberOfLines={1}>
          {msg.ngoName}
        </Text>

        {/* Event title */}
        <View style={styles.eventRow}>
          <Feather name="shield" size={12} color={colors.textTertiary} style={styles.eventIcon} />
          <Text style={[styles.eventTitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {msg.eventTitle}
          </Text>
        </View>

        {/* Message excerpt */}
        <Text style={[styles.excerpt, { color: colors.textTertiary }]} numberOfLines={2}>
          {msg.observationExcerpt}
        </Text>

        {/* Footer: Message ID */}
        <Text style={[styles.msgId, typography.tabular, { color: colors.textTertiary }]}>
          {msg.messageId}
        </Text>
      </Pressable>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Messages
        </Text>
        {IS_MESSAGES_STUB && <SampleDataBadge source="sample" />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandPrimary}
            colors={[colors.brandPrimary]}
          />
        }>
        {/* Always available, even if the sent list fails to load */}
        <Pressable
          onPress={() => router.push('/message/compose')}
          style={({ pressed }) => [
            styles.newMessageBtn,
            { backgroundColor: pressed ? colors.actionPrimaryPressed : colors.actionPrimary },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Write a new message to a verified NGO">
          <Feather name="send" size={16} color={colors.onActionPrimary} />
          <Text style={[styles.newMessageText, { color: colors.onActionPrimary }]}>
            New message to an NGO
          </Text>
        </Pressable>

        {uiState === 'loading' ? (
          renderLoading()
        ) : uiState === 'error' || uiState === 'offline' ? (
          renderError()
        ) : messages.length === 0 ? (
          renderEmpty()
        ) : (
          <View style={styles.messageList}>
            {messages.map(renderMessageRow)}
          </View>
        )}
      </ScrollView>

      <BottomNavBar activeTab="messages" />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  newMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: touchTargets.min,
    borderRadius: radii.button,
    marginBottom: spacing.md,
  },
  newMessageText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
  },
  stubChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.xs,
  },
  stubChipText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  messageList: {
    gap: spacing.cardGap,
  },

  // Message row
  messageRow: {
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    marginHorizontal: spacing.screenPadding,
    gap: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
  },
  ngoName: {
    ...typography.cardTitle,
    fontSize: 15,
    lineHeight: 21,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    marginRight: 5,
  },
  eventTitle: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  excerpt: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
  },
  msgId: {
    ...typography.caption,
    fontSize: 10,
    marginTop: spacing.xxs,
  },

  // Empty / Error / Loading
  emptyContainer: {
    borderRadius: radii.card,
    padding: spacing.xxl,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.cardTitle,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyAction: {
    height: touchTargets.min,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  emptyActionText: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    ...typography.caption,
    fontSize: 13,
  },
});
