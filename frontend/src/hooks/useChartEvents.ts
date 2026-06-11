import React, { createContext, ReactNode, useContext, useState, useCallback, useEffect } from 'react';

export type ChartEventType = 'SELECT_CATEGORY' | 'CLEAR_FILTER';

export interface ChartEvent {
  type: ChartEventType;
  payload: {
    categoryName?: string;
    chartId?: string;
    timestamp: number;
  };
}

export interface ChartEventsContextType {
  lastEvent: ChartEvent | null;
  subscribe: (listener: (event: ChartEvent) => void) => () => void;
  emit: (event: ChartEvent) => void;
}

const ChartEventsContext = createContext<ChartEventsContextType | undefined>(undefined);

export function ChartEventsProvider({ children }: { children: ReactNode }) {
  const [lastEvent, setLastEvent] = useState<ChartEvent | null>(null);
  const [listeners, setListeners] = useState<Set<(event: ChartEvent) => void>>(new Set());

  const subscribe = useCallback((listener: (event: ChartEvent) => void) => {
    setListeners((prev) => {
      const newListeners = new Set(prev);
      newListeners.add(listener);
      return newListeners;
    });
    return () => {
      setListeners((prev) => {
        const newListeners = new Set(prev);
        newListeners.delete(listener);
        return newListeners;
      });
    };
  }, []);

  const emit = useCallback((event: ChartEvent) => {
    setLastEvent(event);
    listeners.forEach((listener) => listener(event));
  }, [listeners]);

  const value: ChartEventsContextType = {
    lastEvent,
    subscribe,
    emit,
  };

  return React.createElement(
    ChartEventsContext.Provider,
    { value },
    children
  );
}

export function useChartEvents() {
  const context = useContext(ChartEventsContext);
  if (!context) {
    throw new Error('useChartEvents must be used within ChartEventsProvider');
  }
  return context;
}

export function useChartEventListener(
  eventType: ChartEventType,
  callback: (event: ChartEvent) => void,
) {
  const { subscribe } = useChartEvents();
  
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.type === eventType) {
        callback(event);
      }
    });
    return unsubscribe;
  }, [eventType, callback, subscribe]);
}

export function useChartEventEmitter() {
  const { emit } = useChartEvents();
  return useCallback(
    (type: ChartEventType, payload: Partial<ChartEvent['payload']> = {}) => {
      emit({
        type,
        payload: {
          ...payload,
          timestamp: Date.now(),
        },
      });
    },
    [emit],
  );
}

export default useChartEvents;
