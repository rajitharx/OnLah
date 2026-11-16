import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { BackButton } from '../src/shared/components';
import { minTapSize } from '../src/shared/theme';

test('says Back and calls onPress when pressed', async () => {
  const onPress = jest.fn();
  await render(<BackButton onPress={onPress} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('the visible text and the spoken name are the same', async () => {
  await render(<BackButton onPress={() => undefined} label="Close" />);
  expect(screen.getByText('Close')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
});

test('is at least the minimum tap size in both directions', async () => {
  await render(<BackButton onPress={() => undefined} />);
  const style = StyleSheet.flatten(screen.getByRole('button', { name: 'Back' }).props.style);
  expect(style.minHeight).toBeGreaterThanOrEqual(minTapSize);
  expect(style.minWidth).toBeGreaterThanOrEqual(minTapSize);
});
