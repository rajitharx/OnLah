const DISMISS_DISTANCE_PX = 60;

// A downward drag from the sheet header closes it, the way a phone sheet does. Small movements are taps.
export function isSwipeDismiss(startY: number, endY: number): boolean {
  return endY - startY > DISMISS_DISTANCE_PX;
}
