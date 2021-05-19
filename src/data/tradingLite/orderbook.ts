import {
  DataApi,
  ICanBeSubscribed,
  SubscriberCallback
} from '../../common/types';
import { Builder, until } from 'selenium-webdriver';

export type TradingLiteOrders = {
  [price: string]: string;
};

export interface ITradingLiteOrderBook {
  asks: TradingLiteOrders | null;
  bids: TradingLiteOrders | null;
}

type TradingLiteOrderbookCallback = SubscriberCallback<ITradingLiteOrderBook>;

class TradingLiteOrderBook implements ICanBeSubscribed<ITradingLiteOrderBook> {
  subscribers: Set<TradingLiteOrderbookCallback>;
  constructor(symbol = 'BTCUSDT') {
    this.subscribers = new Set();
    this._init(symbol);
  }

  async _init(symbol: string): Promise<void> {
    const driver = await new Builder().forBrowser('chrome').build();
    try {
      await driver.get('https://tradinglite.com/chart/m2YbEmvm');
      await driver.wait(until.titleContains(symbol), 1000000);

      setInterval(async () => {
        const result = await driver.executeScript(
          'let ob = orderbook(); return { asks: Object.fromEntries(ob.asks), bids: Object.fromEntries(ob.bids) }'
        );

        this.subscribers.forEach((callback) => {
          callback(<ITradingLiteOrderBook>result);
        });
      }, 2000);
    } catch (error) {
      await driver.quit();
    }
  }

  subscribe = (callback: TradingLiteOrderbookCallback): void => {
    this.subscribers.add(callback);
  };

  unsubscribe = (callback: TradingLiteOrderbookCallback): void => {
    this.subscribers.delete(callback);
  };
}

const getOrderbookAPI = (
  symbol: string
): DataApi<TradingLiteOrderbookCallback> => {
  const orderBook = new TradingLiteOrderBook(symbol);

  return {
    subscribe: orderBook.subscribe,
    unsubscribe: orderBook.unsubscribe
  };
};

export { getOrderbookAPI };
