export const rangeIncludes = (value: number, start: number, end: number) =>
  Math.min(start, end) <= value && Math.max(start, end) >= value
