import React from 'react';
import { RoomUtilizationItem } from '../../utils/adminAnalytics';
import { DoorClosed, Loader2 } from 'lucide-react';

export interface RoomUtilizationTableProps {
  items: RoomUtilizationItem[];
  selectedDate: string;
  isLoading?: boolean;
}

export const RoomUtilizationTable: React.FC<RoomUtilizationTableProps> = ({
  items,
  selectedDate,
  isLoading = false,
}) => {
  const getBarColor = (percent: number) => {
    if (percent === 0) return 'bg-slate-300';
    if (percent < 30) return 'bg-blue-600';
    if (percent < 70) return 'bg-indigo-600';
    return 'bg-emerald-600';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <DoorClosed className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">
              Tỷ lệ sử dụng từng phòng
            </h4>
            <p className="text-xs text-slate-500 truncate">
              Mật độ đặt phòng ngày {selectedDate} ({items.length} phòng)
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-semibold">Đang tính toán tỷ lệ sử dụng phòng...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs italic">
          Không có dữ liệu phòng nào được ghi nhận.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="w-10 sm:w-14 py-2.5 pl-3 pr-1 text-center">
                    #
                  </th>
                  <th scope="col" className="w-32 sm:w-44 py-2.5 px-2">
                    Phòng
                  </th>
                  <th scope="col" className="w-16 sm:w-20 py-2.5 px-2 text-center">
                    Tầng
                  </th>
                  <th scope="col" className="py-2.5 pl-2 pr-3">
                    Tỷ lệ sử dụng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((item, index) => {
                  const hoursBooked = (item.totalBookedMinutes / 60).toFixed(1);
                  const hoursOpen = (item.totalOpenMinutes / 60).toFixed(1);

                  return (
                    <tr
                      key={item.roomId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.isMaintenance ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Thứ hạng */}
                      <td className="py-2.5 pl-3 pr-1 text-center font-bold text-slate-400 text-[11px]">
                        {index + 1}
                      </td>

                      {/* Mã phòng + loại phòng */}
                      <td className="py-2.5 px-2 min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {item.roomCode}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate" title={item.roomType}>
                          {item.roomType}
                        </div>
                      </td>

                      {/* Badge tầng */}
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
                          {item.floorNumber === 0 ? 'Tầng G' : `Tầng ${item.floorNumber}`}
                        </span>
                      </td>

                      {/* Thanh phần trăm hoặc nhãn Bảo trì */}
                      <td className="py-2.5 pl-2 pr-3 min-w-0">
                        {item.isMaintenance ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Bảo trì
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-1 h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getBarColor(
                                  item.percentage
                                )} rounded-full transition-all duration-300`}
                                style={{
                                  width: `${Math.max(
                                    item.percentage > 0 ? 3 : 0,
                                    item.percentage
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="font-bold text-slate-800 text-xs shrink-0 w-11 text-right">
                              {item.percentage}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal hidden md:inline shrink-0">
                              ({hoursBooked}h/{hoursOpen}h)
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
