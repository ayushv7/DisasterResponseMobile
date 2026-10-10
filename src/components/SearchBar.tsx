import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { radii, spacing, touchTargets } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search river, district or keyword',
}: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceMuted,
          },
        ]}>
        <Feather
          name="search"
          size={17}
          color={colors.textTertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.input,
            typography.body,
            { color: colors.textPrimary },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search flood events by river, district, or keyword"
        />
        {value.length > 0 && (
          <Pressable
            onPress={onClear}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search text"
            hitSlop={spacing.sm}>
            <Feather name="x-circle" size={17} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPadding,
    marginVertical: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTargets.min,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});
