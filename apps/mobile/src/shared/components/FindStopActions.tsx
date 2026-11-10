import React from 'react';
import { ActionButton } from './ActionButton';

interface FindStopActionsProps {
  onNavigate: (view: 'search' | 'nearby') => void;
}

// The two ways to find a stop, offered wherever a list is empty.
export function FindStopActions({ onNavigate }: FindStopActionsProps): React.JSX.Element {
  return (
    <>
      <ActionButton label="Search stops" icon="search" onPress={() => onNavigate('search')} />
      <ActionButton label="Find nearby" icon="compass" onPress={() => onNavigate('nearby')} />
    </>
  );
}
