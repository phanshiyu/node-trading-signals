import { CandleChartInterval } from 'binance-api-node';
import { getChartAPI } from './data/binance/futures';
import { Stoch } from './indicators/stoch';

const { subscribe } = getChartAPI('BTCUSDT', CandleChartInterval.ONE_HOUR);

// all sequences will be based on the timeline
const timeline: number[] = [];

// create indicator instances here
const indicatorStoch = new Stoch(14, 3);

function onInitialization(
  candleOpenTime: number,
  candleLow: number,
  candleHigh: number,
  candleClose: number
) {
  indicatorStoch.update(
    timeline,
    candleOpenTime,
    candleLow,
    candleHigh,
    candleClose
  );
}

function onRemoval(time: number) {
  indicatorStoch.remove(time);
}

function onUpdate(
  candleOpenTime: number,
  candleLow: number,
  candleHigh: number,
  candleClose: number
) {
  indicatorStoch.update(
    timeline,
    candleOpenTime,
    candleLow,
    candleHigh,
    candleClose
  );
}

subscribe((candles) => {
  const {
    openTime: lastCandleOpenTime,
    close: lastCandleClose,
    high: lastCandleHigh,
    low: lastCandleLow
  } = candles[candles.length - 1];
  // not initialized
  if (!timeline.length) {
    // initialization: run calculation for all history candles
    for (let i = 0; i < candles.length; i += 1) {
      const {
        close: candleClose,
        openTime: candleOpenTime,
        low: candleLow,
        high: candleHigh
      } = candles[i];
      timeline.push(candleOpenTime);

      onInitialization(
        candleOpenTime,
        parseFloat(candleLow),
        parseFloat(candleHigh),
        parseFloat(candleClose)
      );
    }
  } else {
    // an update or new candle
    if (lastCandleOpenTime !== timeline[timeline.length - 1]) {
      // in
      timeline.push(lastCandleOpenTime);
      // 1 out when 1 in to prevent memory overload
      const timeToRemove = timeline[0];
      timeline.shift();

      // clear memory in indicator
      onRemoval(timeToRemove);
    }

    onUpdate(
      lastCandleOpenTime,
      parseFloat(lastCandleLow),
      parseFloat(lastCandleHigh),
      parseFloat(lastCandleClose)
    );
  }

  // indicatator calculations should have concluded
  // we can run notifiers here
  const lastTime = timeline[timeline.length - 1];
  console.log(indicatorStoch.get(lastTime));
});
