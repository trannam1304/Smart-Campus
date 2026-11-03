import React from 'react';

export interface FloorNavItem {
  floorNumber: number;
  label: string;
  disabled?: boolean;
}

export interface FloorNavBarProps {
  floors: FloorNavItem[];
  activeFloor: number | null;
  onSelect: (n: number) => void;
}

export const FloorNavBar: React.FC<FloorNavBarProps> = ({
  floors,
  activeFloor,
  onSelect,
}) => {
  return (
    <nav
      aria-label="Thanh điều hướng tầng"
      className="sticky top-16 z-30 w-full -mx-4 px-4 sm:-mx-6 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-sm py-2 lg:static lg:w-auto lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none lg:border-none lg:shadow-none lg:sticky lg:top-24 lg:self-start lg:z-10 shrink-0"
    >
      <div className="flex flex-row lg:flex-col items-center gap-2 overflow-x-auto lg:overflow-visible py-0.5 lg:bg-white lg:p-2.5 lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-sm">
        <div className="hidden lg:block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center py-1 border-b border-slate-100 w-full mb-1">
          Tầng
        </div>

        {floors.map((floor) => {
          const isActive = activeFloor === floor.floorNumber;
          const displayText =
            floor.floorNumber === 0 ? 'G' : floor.floorNumber.toString();
          const ariaLabel =
            floor.floorNumber === 0 ? 'Tầng G' : `Tầng ${floor.floorNumber}`;

          return (
            <button
              key={floor.floorNumber}
              type="button"
              disabled={floor.disabled}
              onClick={() => onSelect(floor.floorNumber)}
              aria-label={ariaLabel}
              aria-current={isActive ? 'true' : undefined}
              className={`flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                  : floor.disabled
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200/60'
                  : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 shadow-sm active:scale-95'
              }`}
            >
              {displayText}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
