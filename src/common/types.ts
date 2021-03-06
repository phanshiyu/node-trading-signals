export type SubscriberCallback<ResultType> = (result: ResultType) => void;

export interface ICanBeSubscribed<ResultCallback> {
  subscribe: (cb: SubscriberCallback<ResultCallback>) => void;
  unsubscribe: (cb: SubscriberCallback<ResultCallback>) => void;
}

export interface ISequence<SequenceValueType> {
  [key: number]: SequenceValueType | null;
}

export interface DataApi<CallbackType> {
  subscribe: (cb: CallbackType) => void;
  unsubscribe: (cb: CallbackType) => void;
  clean?: () => void;
}
