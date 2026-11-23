export type WashTool = 'empty' | 'soap' | 'ewer' | 'dirty';
export type WashPerson = 'arif' | 'mahmut' | 'yolcu';
/** Stages are saved per person. Soap must be applied before the two-handed scrub. */
export function requiredWashTool(stage: number, soapApplied: boolean): WashTool {
  if (stage === 0) return 'empty';
  if (stage === 1 || stage === 2) return soapApplied ? 'empty' : 'soap';
  return 'ewer';
}
export function washInstruction(stage: number, soapApplied: boolean): string {
  if (stage === 0) return 'Boş ellerle yüzü ve elleri temizle';
  if (stage === 1 || stage === 2) {
    const side = stage === 1 ? 'sağ' : 'sol';
    return soapApplied ? `Sabunu yerine bırak, iki elle ${side} tarafı yıka` : `Sabunu al, ${side} tarafa sür`;
  }
  return 'İbriği al, temiz suyla durula';
}
