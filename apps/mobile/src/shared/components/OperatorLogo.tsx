import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { typography } from '../theme';
import { operatorName } from '../utils/operators';

interface OperatorLogoProps {
  operator: string;
}

// No logo files ship with the app yet, so the operator's name shows as text. A logo map can slot in here later.
export function OperatorLogo({ operator }: OperatorLogoProps): React.JSX.Element {
  return (
    <Text allowFontScaling={true} style={styles.name}>
      {operatorName(operator)}
    </Text>
  );
}

const styles = StyleSheet.create({
  name: {
    ...typography.caption,
  },
});
