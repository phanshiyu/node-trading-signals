import { ISequence } from '../common/types';
import { TradingLiteOrders } from '../data/tradingLite/orderbook';

class BuySellPressure {
  depthPercentage: number;
  buySellPressure: ISequence<number> = {};

  constructor(depthPercentage = 40) {
    this.depthPercentage = depthPercentage;
  }

  get(time?: number): number | null {
    if (time === undefined) {
      return null;
    } else {
      return this.buySellPressure[time] !== undefined
        ? this.buySellPressure[time]
        : null;
    }
  }

  update(
    candleOpenTime: number,
    candleClose: number,
    asks: TradingLiteOrders | null | undefined,
    bids: TradingLiteOrders | null | undefined
  ): number | null {
    if (asks && bids && candleClose) {
      const bidsDepthVol = sumByDepthPercentage(
        candleClose,
        bids,
        this.depthPercentage
      );
      const asksDepthVol = sumByDepthPercentage(
        candleClose,
        asks,
        this.depthPercentage
      );
      const pressure = (100 * (bidsDepthVol - asksDepthVol)) / asksDepthVol;
      this.buySellPressure[candleOpenTime] = pressure;

      return pressure;
    }

    this.buySellPressure[candleOpenTime] = null;
    return null;
  }

  remove(time: number): void {
    delete this.buySellPressure[time];
  }
}

function sumByDepthPercentage(
  closePrice: number,
  orders: TradingLiteOrders,
  percentage = 100
) {
  const priceRange = getPriceRange(closePrice, percentage);

  let totalDepthVol = 0;
  Object.keys(orders).forEach((price) => {
    const quantity = parseFloat(orders[price]);
    const parsedPrice = parseFloat(price);

    // check within range
    if (parsedPrice >= priceRange[0] && parsedPrice <= priceRange[1]) {
      totalDepthVol += quantity;
    }
  });

  return totalDepthVol;
}

function getPriceRange(price: number, percentage: number) {
  const delta = price * (percentage / 100);
  return [price - delta, price + delta];
}

export { BuySellPressure };
