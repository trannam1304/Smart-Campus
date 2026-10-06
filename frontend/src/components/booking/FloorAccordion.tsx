import React, { useState } from 'react';
import { FloorData, Room } from '../../types/booking';
import { InteractiveFloorPlan } from './InteractiveFloorPlan';
import { ChevronDown, Layers } from 'lucide-react';

interface FloorAccordionProps {
  floors: FloorData[];
  onBookRoom: (room: Room, defaultDate?: string, defaultTime?: string) => void;
  onViewSchedule?: (room: Room) => void;
  onReportIncident?: (room: Room) => void;
}

export const FloorAccordion: React.FC<FloorAccordionProps> = ({ floors, onBookRoom, onViewSchedule, onReportIncident }) => {
  const [openFloors, setOpenFloors] = useState<number[]>([0, 1, 2, 3, 4, 5]);

  const toggleFloor = (floorNumber: number) => {
    setOpenFloors(prev =>
      prev.includes(floorNumber)
        ? prev.filter(f => f !== floorNumber)
        : [...prev, floorNumber]
    );
  };

  return (
    <div className="space-y-4">
      {floors.map((floor) => {
        const isOpen = openFloors.includes(floor.floorNumber);
        return (
          <div key={floor.floorNumber} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
            <button
              onClick={() => toggleFloor(floor.floorNumber)}
              className="w-full flex items-center justify-between p-5 bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{floor.floorCode}</h3>
                  <p className="text-xs text-slate-500 font-medium">{floor.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {floor.availableRooms}/{floor.totalRooms} phòng trống
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isOpen && (
              <div className="p-5 border-t border-slate-100 bg-white">
                <div className="w-full">
                  <InteractiveFloorPlan 
                    floorId={floor.floorNumber.toString()} 
                    onBookRoom={onBookRoom} 
                    onViewSchedule={onViewSchedule} 
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
