import { CrowdLevel } from '../../types/domain';
import { colors } from '../theme/colors';

export function getCrowdColor(level: CrowdLevel): string {
  switch (level) {
    case 0: return colors.crowdGreen;
    case 1: return colors.crowdAmber;
    case 2: return colors.crowdRed;
  }
}

export function getCrowdLabel(level: CrowdLevel): string {
  switch (level) {
    case 0: return 'Seats';
    case 1: return 'Standing';
    case 2: return 'Crowded';
  }
}
