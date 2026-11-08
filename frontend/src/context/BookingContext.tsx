import React, { createContext, useContext, useState, useEffect } from 'react';
import { FloorData } from '../types/booking';
import { USE_MOCK } from '../config/env';
import { mockStore } from '../api/mock/mockStore';
import { mockInitialFloors } from '../api/mock/mockData';

interface BookingContextType {
  floors: FloorData[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [floors, setFloors] = useState<FloorData[]>(() => {
    if (USE_MOCK) {
      return mockStore.getState().floors;
    }
    return mockInitialFloors;
  });

  useEffect(() => {
    if (USE_MOCK) {
      setFloors(mockStore.getState().floors);
      const unsubscribe = mockStore.subscribe(() => {
        setFloors(mockStore.getState().floors);
      });
      return unsubscribe;
    }
  }, []);

  return (
    <BookingContext.Provider value={{ floors }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
};
