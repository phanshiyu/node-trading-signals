import { ISequence } from '../common/types';

class Stoch {
  low: ISequence<number> = {};
  high: ISequence<number> = {};
  stochs: ISequence<number> = {};
  smoothenedK: ISequence<number> = {};
  period: number;
  smooth: number;

  constructor(period = 14, smooth = 3) {
    this.period = period;
    this.smooth = smooth;
  }

  get(time?: number): number | null {
    if (time === undefined) {
      return null;
    } else {
      return this.smoothenedK[time] !== undefined
        ? this.smoothenedK[time]
        : null;
    }
  }

  update(
    timeline: number[],
    candleOpenTime: number,
    candleLow: number,
    candleHigh: number,
    candleClose: number
  ): number | null {
    this.low[candleOpenTime] = candleLow;
    this.high[candleOpenTime] = candleHigh;
    this.stochs[candleOpenTime] = stoch(
      timeline,
      candleClose,
      this.high,
      this.low,
      this.period
    );
    this.smoothenedK[candleOpenTime] = sma(timeline, this.stochs, this.smooth);

    return this.smoothenedK[candleOpenTime];
  }

  remove(time: number): void {
    delete this.low[time];
    delete this.high[time];
    delete this.stochs[time];
    delete this.smoothenedK[time];
  }
}

function stoch(
  timeline: number[] = [],
  close: number,
  high: ISequence<number>,
  low: ISequence<number>,
  period = 14
): number | null {
  const lowestLow = lowest(timeline, low, period);
  const highestHigh = highest(timeline, high, period);
  const k =
    lowestLow !== null && highestHigh !== null
      ? calculateK(lowestLow, highestHigh, close)
      : null;

  return k;
}

function sma(
  timeline: number[],
  sequence: ISequence<number>,
  period = 14
): number | null {
  if (timeline.length < period) {
    return null;
  }

  let sum = 0;

  for (let i = 1; i <= period; i += 1) {
    const openTime = timeline[timeline.length - i];
    const sequenceValue = sequence[openTime];

    if (sequenceValue !== null) {
      sum += sequenceValue;
    }
  }

  return sum / period;
}

function calculateK(lowestLow: number, highestHigh: number, close: number) {
  return (100 * (close - lowestLow)) / (highestHigh - lowestLow);
}

function lowest(timeline: number[], sequence: ISequence<number>, period = 14) {
  if (timeline.length < period) {
    return null;
  }

  let min = Number.MAX_SAFE_INTEGER;
  for (let i = 1; i <= period; i += 1) {
    const openTime = timeline[timeline.length - i];
    const val = sequence[openTime];

    if (val !== null) {
      min = Math.min(min, val);
    }
  }

  return min;
}

function highest(timeline: number[], sequence: ISequence<number>, period = 14) {
  if (timeline.length < period) {
    return null;
  }

  let max = 0;
  for (let i = 1; i <= period; i += 1) {
    const openTime = timeline[timeline.length - i];
    const val = sequence[openTime];

    if (val !== null) {
      max = Math.max(max, val);
    }
  }

  return max;
}

export { Stoch };
