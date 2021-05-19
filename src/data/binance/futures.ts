import Binance, {
  Binance as IBinance,
  CandleChartInterval,
  CandleChartResult
} from 'binance-api-node';
import { ICanBeSubscribed, SubscriberCallback } from '../../common/types';

type ChartSubscriberCallback = SubscriberCallback<CandleChartResult[]>;

const client = Binance();

class FuturesChart implements ICanBeSubscribed<CandleChartResult[]> {
  initialized = false;
  candles: CandleChartResult[] = [];
  subscribers: Set<(candles: CandleChartResult[]) => void>;
  clean: () => void = () => {
    throw new Error('No clean up');
  };

  constructor(
    binanceClient: IBinance,
    symbol: string,
    interval: CandleChartInterval
  ) {
    this.initialized = false;
    this.subscribers = new Set();

    // get snapshot
    binanceClient
      .futuresCandles({
        symbol,
        interval
      })
      .then((results) => {
        this.initialized = true;
        this.candles = results;

        // Subscribe to updates
        this.clean = binanceClient.ws.futuresCandles(
          symbol,
          interval,
          (candle) => {
            if (this.candles.length) {
              const lastCandle = this.candles[this.candles.length - 1];
              if (lastCandle.openTime === candle.startTime) {
                // update
                this.candles[this.candles.length - 1] = {
                  ...lastCandle,
                  open: candle.open,
                  high: candle.high,
                  low: candle.low,
                  close: candle.close,
                  volume: candle.volume,
                  quoteVolume: candle.quoteVolume,
                  trades: candle.trades,
                  baseAssetVolume: candle.buyVolume,
                  quoteAssetVolume: candle.quoteBuyVolume
                };
              } else {
                // remove first
                this.candles.shift();
                // add
                this.candles.push({
                  openTime: candle.startTime,
                  closeTime: candle.closeTime,
                  open: candle.open,
                  high: candle.high,
                  low: candle.low,
                  close: candle.close,
                  volume: candle.volume,
                  quoteVolume: candle.quoteVolume,
                  trades: candle.trades,
                  baseAssetVolume: candle.buyVolume,
                  quoteAssetVolume: candle.quoteBuyVolume
                });
              }
            }

            // notify subscribers
            this.subscribers.forEach((callback) => callback(this.candles));
          }
        );
      });
  }

  subscribe = (callback: ChartSubscriberCallback) => {
    this.subscribers.add(callback);
  };

  unsubscribe = (callback: ChartSubscriberCallback) => {
    this.subscribers.delete(callback);
  };
}

interface ChartApi {
  subscribe: (cb: ChartSubscriberCallback) => void;
  unsubscribe: (cb: ChartSubscriberCallback) => void;
  clean: () => void;
}

const getChartAPI = (
  symbol: string,
  interval: CandleChartInterval
): ChartApi => {
  const chart = new FuturesChart(client, symbol, interval);

  return {
    subscribe: chart.subscribe,
    unsubscribe: chart.unsubscribe,
    clean: () => chart.clean()
  };
};

export { getChartAPI };
