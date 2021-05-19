import { CandleChartInterval } from 'binance-api-node';
import { getChartAPI } from './data/binance/futures';
import {
  getOrderbookAPI,
  ITradingLiteOrderBook
} from './data/tradingLite/orderbook';
import { BuySellPressure } from './indicators/buySellPressure';
import { Stoch } from './indicators/stoch';

const { subscribe } = getChartAPI('BTCUSDT', CandleChartInterval.ONE_HOUR);
const { subscribe: subscribeOrderbook } = getOrderbookAPI('BTCUSDT');

// all sequences will be based on the timeline
const timeline: number[] = [];

// global state
let orderbook: ITradingLiteOrderBook | undefined;

// create indicator instances here
const indicatorStoch = new Stoch(14, 3);
const indicatorBuySellPressure = new BuySellPressure(10);

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
  indicatorBuySellPressure.remove(time);
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
  indicatorBuySellPressure.update(
    candleOpenTime,
    candleClose,
    orderbook?.asks,
    orderbook?.bids
  );

  console.log(indicatorBuySellPressure.get(timeline[timeline.length - 1]));
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
  //   console.log(indicatorStoch.get(lastTime));
});

subscribeOrderbook((ob) => {
  if (ob && ob.asks && ob.bids) {
    orderbook = ob;
  }
});
