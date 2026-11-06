import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchStackParamList } from '../../app/navigation/types';
import { SkeletonTiles } from '../../shared/components';
import { colors, minTapSize, spacing, typography } from '../../shared/theme';
import { BusStop } from '../../types/domain';
import { useSearchBusStops } from './useSearchBusStops';

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

export function SearchScreen({ navigation }: Props): React.JSX.Element {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { results, isLoading, error, hasSearched, search, clear } = useSearchBusStops();

  function handleChangeText(text: string): void {
    setQuery(text);
    search(text);
  }

  function handleClear(): void {
    setQuery('');
    clear();
    inputRef.current?.focus();
  }

  function handleStopPress(stop: BusStop): void {
    navigation.navigate('Arrivals', {
      stopCode: stop.busStopCode,
      stopName: stop.description,
      roadName: stop.roadName,
    });
  }

  function renderStop({ item }: { item: BusStop }): React.JSX.Element {
    return (
      <Pressable
        style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
        onPress={() => handleStopPress(item)}
      >
        <View style={styles.codeChip}>
          <Text allowFontScaling={true} style={styles.codeText}>
            {item.busStopCode}
          </Text>
        </View>
        <View style={styles.stopInfo}>
          <Text allowFontScaling={true} style={styles.stopName} numberOfLines={1}>
            {item.description}
          </Text>
          <Text allowFontScaling={true} style={typography.caption} numberOfLines={1}>
            {item.roadName}
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.muted} />
      </Pressable>
    );
  }

  const showEmpty = hasSearched && !isLoading && results.length === 0 && !error;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text allowFontScaling={true} style={styles.title}>
          Search
        </Text>
      </View>

      <View style={styles.inputRow}>
        <Feather name="search" size={16} color={colors.muted} style={styles.inputIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Bus stop code or name…"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={handleChangeText}
          autoCorrect={false}
          autoCapitalize="none"
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
            <Feather name="x" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {error !== null && !isLoading && (
        <Text allowFontScaling={true} style={styles.errorText}>
          {error}
        </Text>
      )}

      {/* The list stays mounted while a search runs, so earlier results do not vanish on each keystroke. */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.busStopCode}
        renderItem={renderStop}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? (
            <SkeletonTiles label="Searching for stops" />
          ) : showEmpty ? (
            <View style={styles.centred}>
              <Feather name="inbox" size={32} color={colors.muted} />
              <Text allowFontScaling={true} style={styles.emptyText}>
                No stops found
              </Text>
            </View>
          ) : !hasSearched ? (
            <View style={styles.centred}>
              <Feather name="map-pin" size={32} color={colors.muted} />
              <Text allowFontScaling={true} style={styles.emptyText}>
                Enter a stop code or name
              </Text>
            </View>
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
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.white,
    padding: 0,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  codeChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 56,
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    color: colors.accent,
  },
  stopInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  stopName: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
  errorText: {
    ...typography.caption,
    color: colors.crowdRed,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
});
