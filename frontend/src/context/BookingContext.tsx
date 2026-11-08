import React, { createContext, useContext, useState } from 'react';
import { FloorData } from '../types/booking';
import { campusFloors } from '../data/floors';

interface BookingContextType {
  floors: FloorData[];
  setFloors?: React.Dispatch<React.SetStateAction<FloorData[]>>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode; initialFloors?: FloorData[] }> = ({
  children,
  initialFloors,
}) => {
  const [floors, setFloors] = useState<FloorData[]>(initialFloors || campusFloors);

  return (
    <BookingContext.Provider value={{ floors, setFloors }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
};
