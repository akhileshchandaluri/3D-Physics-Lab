export const PART_ORDER = ['clamp', 'wire', 'hook', 'scale', 'watch', 'sheet', 'hanger'] as const

export type PartId = (typeof PART_ORDER)[number]

export type Placed = Record<PartId, boolean>

export function emptyPlaced(): Placed {
  return {
    clamp: false,
    wire: false,
    hook: false,
    scale: false,
    watch: false,
    sheet: false,
    hanger: false,
  }
}

export function nextPart(placed: Placed): PartId | null {
  return PART_ORDER.find((part) => !placed[part]) ?? null
}

export function hintFor(next: PartId | null, massKg: number): string {
  switch (next) {
    case 'clamp':
      return 'Attach the upper clamp to the cross-arm.'
    case 'wire':
      return 'Hang a wire from the clamp. The workbook uses soldering lead.'
    case 'hook':
      return 'Fit the lower hook on the free end of the wire.'
    case 'scale':
      return 'Place the millimetre scale beside the wire.'
    case 'watch':
      return 'Put the stopwatch on the bench.'
    case 'sheet':
      return 'Place the blank observation sheet on the bench.'
    case 'hanger':
      return 'Hang the weight hanger on the hook.'
    default:
      return massKg > 0
        ? 'Press Start, then press Lap every 3 to 5 minutes. l₀ is fixed when the watch starts.'
        : 'Hang a 200 g weight on the carrier, then press Start.'
  }
}
