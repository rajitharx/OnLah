import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchStackParamList } from '../../app/navigation/types';
import { ActionButton, EmptyState, Icon, SkeletonRow, StopCard } from '../../shared/components';
import { colors, minTapSize, radius, spacing, typography } from '../../shared/theme';
import { BusStop } from '../../types/domain';
import { noMatchMessage, searchAnnouncement, searchFailureMessage } from './searchStatus';
import { useSearchQueryStore } from './searchQueryStore';
import { useStopSearch } from './useStopSearch';

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

function ResultSeparator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

export function SearchScreen({ navigation }: Props): React.JSX.Element {
  const { query, setQuery } = useSearchQueryStore();
  const [attempt, setAttempt] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const search = useStopSearch(query, attempt);
  const { check, results, loading, failure } = search;
  const status = searchAnnouncement(search, results.length);
  const noMatch = check.kind === 'ok' && !loading && failure === null && results.length === 0;
  const term = check.kind === 'ok' ? check.term : '';

  function handleClear(): void {
    setQuery('');
    inputRef.current?.focus();
  }

  function handleOpen(stop: BusStop): void {
    navigation.navigate('Arrivals', {
      stopCode: stop.busStopCode,
      stopName: stop.description,
      roadName: stop.roadName,
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.busStopCode}
        renderItem={({ item }) => <StopCard stop={item} onOpen={handleOpen} highlight={term} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ItemSeparatorComponent={ResultSeparator}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text allowFontScaling={true} accessibilityRole="header" style={styles.title}>Search stops</Text>
            <Text allowFontScaling={true} style={typography.caption}>Stop code or road name</Text>
            <View style={styles.inputRow}>
              <Icon name="search" size={16} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="e.g. 01012 or Victoria"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Stop code or road name"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                returnKeyType="search"
                clearButtonMode="never"
              />
              {query.length > 0 && (
                <Pressable
                  onPress={handleClear}
                  style={styles.clearBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Icon name="x" size={16} />
                </Pressable>
              )}
            </View>

            {status !== '' && !noMatch && (
              <Text allowFontScaling={true} accessibilityLiveRegion="polite" style={typography.caption}>
                {status}
              </Text>
            )}
            {check.kind === 'code-too-long' && (
              <Text allowFontScaling={true} accessibilityRole="alert" style={styles.error}>
                Stop codes are 5 digits.
              </Text>
            )}
            {check.kind === 'too-short' && (
              <Text allowFontScaling={true} style={typography.caption}>Type at least 2 characters.</Text>
            )}
            {failure !== null && (
              <View style={styles.retry}>
                <Text allowFontScaling={true} accessibilityRole="alert" style={styles.error}>
                  {searchFailureMessage(failure)}
                </Text>
                {failure === 'unavailable' && (
                  <ActionButton label="Try again" icon="refresh-cw" onPress={() => setAttempt((n) => n + 1)} />
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          check.kind === 'empty' ? (
            <EmptyState icon="search" message="Type a stop code or road to search." />
          ) : noMatch ? (
            <EmptyState icon="inbox" message={noMatchMessage(check.term)} />
          ) : loading ? (
            <SkeletonRow />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  clearBtn: {
    minWidth: minTapSize,
    minHeight: minTapSize,
    alignItems: 'center',
    justifyContent: 'center',
    // Offsets the row padding so the 44pt target does not make the search bar taller.
    marginVertical: -spacing.sm,
    marginRight: -spacing.sm,
  },
  retry: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  error: {
    ...typography.caption,
    color: colors.crowdRed,
  },
  separator: {
    height: spacing.sm,
  },
});
