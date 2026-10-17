import { create } from 'zustand';
import { TrainAlertDetail, TrainServiceStatus } from '../../types/domain';

interface DisruptionState {
  status: TrainServiceStatus;
  alerts: TrainAlertDetail[];
  fetchedAt: string | null;
  dismissedAt: string | null;
  setAlerts: (
    status: TrainServiceStatus,
    alerts: TrainAlertDetail[],
    fetchedAt: string,
  ) => void;
  dismiss: () => void;
}

export const useDisruptionStore = create<DisruptionState>()((set) => ({
  status: 0,
  alerts: [],
  fetchedAt: null,
  dismissedAt: null,
  setAlerts: (status, alerts, fetchedAt) =>
    set({ status, alerts, fetchedAt, dismissedAt: null }),
  dismiss: () => set({ dismissedAt: new Date().toISOString() }),
}));
