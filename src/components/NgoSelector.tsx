import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { VerifiedNgo } from '@/types/messaging';

interface NgoSelectorProps {
  /** Currently selected NGO, or null if none selected. */
  selected: VerifiedNgo | null;
  /** Full list of verified NGOs to display in the picker. */
  ngos: VerifiedNgo[];
  /** Whether the NGO list is still loading. */
  isLoading: boolean;
  /** Error message if the NGO list failed to load. */
  loadError: string | null;
  /** Called when the user picks an NGO from the list. */
  onSelect: (ngo: VerifiedNgo) => void;
  /** Called when the user taps retry after a load error. */
  onRetryLoad: () => void;
}

/**
 * NGO selection trigger + modal sheet.
 *
 * Renders a pressable selector row that opens a bottom-sheet style modal
 * listing all verified NGOs. Selection dismisses the modal and updates the
 * form state via onSelect().
 */
export function NgoSelector({
  selected,
  ngos,
  isLoading,
  loadError,
  onSelect,
  onRetryLoad,
}: NgoSelectorProps) {
  const { colors } = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleSelect = (ngo: VerifiedNgo) => {
    onSelect(ngo);
    setOpen(false);
  };

  return (
    <>
      {/* ── Selector Trigger ─────────────────────────────── */}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={selected ? `Selected NGO: ${selected.name}. Tap to change.` : 'Select a verified NGO'}
        android_ripple={{ color: colors.surfaceMuted }}
        style={[
          styles.trigger,
          { backgroundColor: colors.surface },
        ]}
      >
        {selected ? (
          <View style={styles.selectedContent}>
            <View style={styles.selectedTextGroup}>
              <View style={styles.verifiedRow}>
                <Feather name="check-circle" size={14} color={colors.statusResolved} />
                <Text style={[styles.verifiedLabel, { color: colors.statusResolved }]}>
                  Verified NGO
                </Text>
              </View>
              <Text style={[styles.selectedName, { color: colors.textPrimary }]} numberOfLines={1}>
                {selected.name}
              </Text>
              <Text style={[styles.selectedFocus, { color: colors.textTertiary }]} numberOfLines={1}>
                {selected.focusAreas.slice(0, 2).join(' · ')}
              </Text>
            </View>
            <Feather name="chevron-down" size={18} color={colors.textTertiary} />
          </View>
        ) : (
          <View style={styles.placeholderContent}>
            <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
              Select a verified NGO
            </Text>
            <Feather name="chevron-down" size={18} color={colors.textTertiary} />
          </View>
        )}
      </Pressable>

      {/* ── Picker Modal ─────────────────────────────────── */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setOpen(false)}
          accessibilityRole="none"
        />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Sheet Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: colors.surfaceMuted }]} />

          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              Select a Verified NGO
            </Text>
            <Pressable
              onPress={() => setOpen(false)}
              style={styles.sheetCloseButton}
              accessibilityRole="button"
              accessibilityLabel="Close NGO selector"
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Sheet Disclaimer */}
          <Text style={[styles.sheetDisclaimer, { color: colors.textTertiary }]}>
            Only independently verified organizations are shown.
          </Text>

          {/* Content: Loading / Error / List */}
          {isLoading ? (
            <View style={styles.centeredContent}>
              <ActivityIndicator color={colors.brandPrimary} />
              <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
                Loading NGO list…
              </Text>
            </View>
          ) : loadError ? (
            <View style={styles.centeredContent}>
              <Text style={[styles.errorText, { color: colors.statusActive }]}>
                {loadError}
              </Text>
              <Pressable
                onPress={onRetryLoad}
                style={[styles.retryBtn, { backgroundColor: colors.surfaceMuted }]}
                accessibilityRole="button"
                accessibilityLabel="Retry loading NGO list"
              >
                <Text style={[styles.retryBtnText, { color: colors.textPrimary }]}>
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.ngoList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {ngos.map((ngo) => {
                const isSelected = selected?.id === ngo.id;
                return (
                  <Pressable
                    key={ngo.id}
                    onPress={() => handleSelect(ngo)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Select ${ngo.name}`}
                    android_ripple={{ color: colors.surfaceMuted }}
                    style={[
                      styles.ngoRow,
                      isSelected && { backgroundColor: colors.surfaceMuted },
                    ]}
                  >
                    <View style={styles.ngoRowContent}>
                      {/* Verified check */}
                      <Feather
                        name="check-circle"
                        size={16}
                        color={colors.statusResolved}
                        style={styles.ngoCheckIcon}
                      />
                      <View style={styles.ngoTextGroup}>
                        <Text
                          style={[
                            styles.ngoName,
                            { color: colors.textPrimary, fontWeight: isSelected ? '700' : '500' },
                          ]}
                          numberOfLines={2}
                        >
                          {ngo.name}
                        </Text>
                        <Text
                          style={[styles.ngoFocus, { color: colors.textTertiary }]}
                          numberOfLines={1}
                        >
                          {ngo.focusAreas.join(' · ')}
                        </Text>
                      </View>
                    </View>

                    {/* Selection indicator */}
                    {isSelected && (
                      <Feather name="check" size={16} color={colors.brandPrimary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Trigger ───────────────────────────────────────────────────────────────
  trigger: {
    borderRadius: radii.card,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  placeholderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.body,
    fontSize: 15,
  },
  selectedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTextGroup: {
    flex: 1,
    gap: 2,
    marginRight: spacing.sm,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectedName: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '600',
  },
  selectedFocus: {
    ...typography.caption,
    fontSize: 12,
  },

  // ── Modal overlay ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  sheet: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    maxHeight: '72%',
    paddingBottom: spacing.xxxl,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xs,
  },
  sheetTitle: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  sheetCloseButton: {
    padding: spacing.sm,
    margin: -spacing.sm,
  },
  sheetDisclaimer: {
    ...typography.caption,
    fontSize: 12,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },

  // ── NGO list items ────────────────────────────────────────────────────────
  ngoList: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.lg,
  },
  ngoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
  },
  ngoRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  ngoCheckIcon: {
    marginTop: 2,
  },
  ngoTextGroup: {
    flex: 1,
    gap: 2,
  },
  ngoName: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  ngoFocus: {
    ...typography.caption,
    fontSize: 12,
  },

  // ── Loading / Error states ────────────────────────────────────────────────
  centeredContent: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.caption,
    fontSize: 13,
  },
  errorText: {
    ...typography.caption,
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.button,
  },
  retryBtnText: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
});
