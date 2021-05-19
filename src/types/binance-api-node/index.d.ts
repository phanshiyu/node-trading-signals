import 'binance-api-node';

declare module 'binance-api-node' {
  interface WebSocket {
    futuresCandles: (
      pair: string | string[],
      period: CandleChartInterval,
      callback: (ticker: Candle) => void
    ) => ReconnectingWebSocketHandler;
  }
}
