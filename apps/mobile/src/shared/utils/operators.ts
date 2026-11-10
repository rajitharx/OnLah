// Display names for the operator codes the backend sends.
// TIBS is the code the arrivals feed uses. TTS is the code in the LTA reference.
const OPERATOR_NAMES: Record<string, string> = {
  GAS: 'Go-Ahead Singapore',
  SBST: 'SBS Transit',
  SMRT: 'SMRT Buses',
  TIBS: 'Tower Transit Singapore',
  TTS: 'Tower Transit Singapore',
};

export function operatorName(code: string): string {
  return OPERATOR_NAMES[code] ?? code;
}
