import { create } from 'zustand';
import { TrainAlertDetail, TrainServiceStatus } from '../../types/domain';

interface DisruptionState {
  status: TrainServiceStatus;
  alerts: TrainAlertDetail[];
  fetchedAt: string | null;
  dismissedAt: string | null;
  // True when the latest alerts request failed. The last good status stays, but is no longer known to be current.
  hasError: boolean;
  setAlerts: (
    status: TrainServiceStatus,
    alerts: TrainAlertDetail[],
    fetchedAt: string,
  ) => void;
  setError: () => void;
  dismiss: () => void;
}

export const useDisruptionStore = create<DisruptionState>()((set) => ({
  status: 0,
  alerts: [],
  fetchedAt: null,
  dismissedAt: null,
  hasError: false,
  setAlerts: (status, alerts, fetchedAt) =>
    set({ status, alerts, fetchedAt, dismissedAt: null, hasError: false }),
  setError: () => set({ hasError: true }),
  dismiss: () => set({ dismissedAt: new Date().toISOString() }),
}));
