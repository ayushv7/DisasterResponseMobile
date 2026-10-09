import React, { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertCard } from '@/components/AlertCard';
import { AppHeader } from '@/components/AppHeader';
import { BottomNavBar } from '@/components/BottomNavBar';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterChips } from '@/components/FilterChips';
import { InfoBar } from '@/components/InfoBar';
import { SearchBar } from '@/components/SearchBar';
import { SkeletonCard } from '@/components/SkeletonCard';
import { IS_SAMPLE_DATA, SAMPLE_FLOOD_EVENTS } from '@/fixtures/sample-events';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/spacing';
import { FeedFilterStatus, FeedUiState, FloodEvent } from '@/types/disaster';

export default function FloodIntelligenceFeedScreen() {
  const { colors } = useTheme();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FeedFilterStatus>('ALL');

  // UI state: 'loading' | 'success' | 'empty' | 'error' | 'stale'
  const [uiState, setUiState] = useState<FeedUiState>('success');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('12:55 AM');

  // Active dataset
  const [events, setEvents] = useState<FloodEvent[]>(SAMPLE_FLOOD_EVENTS);

  // Dynamic counts for FilterChips
  const counts = useMemo(() => {
    return {
      total: events.length,
      active: events.filter((e) => e.status === 'ACTIVE').length,
      candidate: events.filter((e) => e.status === 'CANDIDATE').length,
      resolved: events.filter((e) => e.status === 'RESOLVED').length,
    };
  }, [events]);

  // Filtered event cards
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (selectedFilter !== 'ALL' && event.status !== selectedFilter) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesLocation = event.location.toLowerCase().includes(query);
        const matchesSummary = event.summary.toLowerCase().includes(query);
        return matchesTitle || matchesLocation || matchesSummary;
      }
      return true;
    });
  }, [events, selectedFilter, searchQuery]);

  // Pull-to-refresh handler (swipe down on the list)
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setUiState('success');
      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }, 700);
  };

  // Retry handler for connection error recovery
  const handleRetry = () => {
    setUiState('loading');
    setTimeout(() => {
      setEvents(SAMPLE_FLOOD_EVENTS);
      setUiState('success');
      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }, 600);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* 1. Clean Header: Only 'Flood Alerts' and formatted time */}
      <AppHeader timeText={lastUpdated} />

      {/* 2. Slim, dismissible Info Notice */}
      <InfoBar isSampleData={IS_SAMPLE_DATA} />

      {/* 3. Combined Stats & Filter Chips */}
      <FilterChips
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        counts={counts}
      />

      {/* 4. Single-line Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={handleClearSearch}
      />

      {/* 5. Scrollable Feed Body (Pull down to reload) */}
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
        {uiState === 'loading' ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : uiState === 'error' ? (
          <ErrorState onRetry={handleRetry} />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="No alerts in this category"
            description={
              searchQuery.trim().length > 0
                ? `No alerts matching "${searchQuery}" under ${selectedFilter} status.`
                : `There are currently no alerts matching the ${selectedFilter} status.`
            }
            actionLabel={
              searchQuery.length > 0 || selectedFilter !== 'ALL'
                ? 'Clear filters'
                : undefined
            }
            onAction={() => {
              setSearchQuery('');
              setSelectedFilter('ALL');
            }}
          />
        ) : (
          <View style={styles.cardList}>
            {filteredEvents.map((event) => (
              <AlertCard key={event.id} event={event} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 6. Bottom Navigation Bar */}
      <BottomNavBar activeTab="alerts" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  cardList: {
    paddingTop: spacing.xs,
  },
});
