import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FloorData, Room } from '../../types/booking';
import { StatusBadge } from '../ui/StatusBadge';
import { Bookmark, Users, Monitor, Copy, Calendar, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { floorMaps, floorImageSizes, floorElevators, FLOOR_VIEW_WIDTH, FLOOR_VIEW_HEIGHT, type RoomRect } from '../../data/floorMaps';
import { getRoomColor } from '../../utils/roomColors';
import { getFloorMapApi } from '../../api/roomApi';
import { minOccupancy } from '../../utils/bookingValidation';

// ── helpers ──────────────────────────────────────────────────

const getRoundedDateAndTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 30) * 30;
  now.setMinutes(roundedMinutes);

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${h}:${m}`,
  };
};

/** Extract filename from a path like `/assets/floors/image3.png` */
const extractFilename = (path?: string): string => {
  if (!path) return 'image3.png';
  const parts = path.split('/');
  return parts[parts.length - 1] || 'image3.png';
};

/** Derive floor number from an image filename for floor-to-room mapping */
const floorNumberToImage: Record<number, string> = {
  0: 'image3.png',
  1: 'image4.png',
  2: 'image5.png',
  3: 'image6.png',
  4: 'image7.png',
  5: 'image8.png',
};

// ── Warn about mismatched room codes ────────────────────────
const warnMismatches = (rooms: Room[], floorNumber: number) => {
  const imgFile = floorNumberToImage[floorNumber];
  if (!imgFile) return;

  // Room codes that have rects in floorMaps for this floor
  const prefix = floorNumber === 0 ? 'L.0' : `L.${floorNumber}`;
  const mapCodes = new Set(
    Object.keys(floorMaps).filter((code) => code.startsWith(prefix)),
  );
  const mockCodes = new Set(rooms.map((r) => r.roomCode));

  mockCodes.forEach((code) => {
    if (!mapCodes.has(code)) {
      console.warn(
        `[FloorPlan] Phòng "${code}" có trong dữ liệu nhưng thiếu rect trong floorMaps.`,
      );
    }
  });
  mapCodes.forEach((code) => {
    if (!mockCodes.has(code)) {
      console.warn(
        `[FloorPlan] Phòng "${code}" có rect trong floorMaps nhưng thiếu trong dữ liệu tầng.`,
      );
    }
  });
};

// ── Calibration draft rect ──────────────────────────────────

interface DraftRect {
  roomCode: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ================================================================
   InteractiveFloorPlan
   ================================================================ */

interface InteractiveFloorPlanProps {
  floorId: string;
  onBookRoom: (room: Room, defaultDate: string, defaultTime: string) => void;
  onViewSchedule?: (room: Room) => void;
}

export const InteractiveFloorPlan: React.FC<InteractiveFloorPlanProps> = ({
  floorId,
  onBookRoom,
  onViewSchedule,
}) => {
  /* ---------- state ---------- */
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [floor, setFloor] = useState<FloorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date and Time picker state
  const { date: initDate, time: initTime } = getRoundedDateAndTime();
  const [selectedDate, setSelectedDate] = useState(initDate);
  const [selectedTime, setSelectedTime] = useState(initTime);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isCalibrateMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('calibrate') === '1' &&
    import.meta.env.DEV;

  const containerRef = useRef<HTMLDivElement>(null);
  const [drafts, setDrafts] = useState<DraftRect[]>([]);
  const [activeHandle, setActiveHandle] = useState<{
    idx: number;
    type: 'move' | 'resize';
    startX: number;
    startY: number;
    origRect: DraftRect;
  } | null>(null);
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);

  /* ---------- data fetching ---------- */

  const fetchData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        const res = await getFloorMapApi(floorId, selectedDate, selectedTime);
        if (res.success && res.data) {
          setFloor(res.data);
        } else {
          setError(res.message || 'Lỗi tải dữ liệu tầng');
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Lỗi mạng';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [floorId, selectedDate, selectedTime],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000); // 30s auto refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  // Warn about mismatches when floor data loads
  useEffect(() => {
    if (floor && Array.isArray(floor.rooms)) {
      warnMismatches(floor.rooms, floor.floorNumber);
    }
  }, [floor]);

  // Seed drafts for calibration mode
  useEffect(() => {
    if (!isCalibrateMode || !floor || !Array.isArray(floor.rooms)) return;
    const seeds: DraftRect[] = floor.rooms.map((r) => {
      const rect = floorMaps[r.roomCode];
      if (rect) {
        return { roomCode: r.roomCode, x: rect.x, y: rect.y, w: rect.w, h: rect.h };
      }
      console.warn(
        `[FloorPlan] Phòng "${r.roomCode}" thiếu rect trong floorMaps, không thể hiển thị mặc định.`,
      );
      return { roomCode: r.roomCode, x: 50, y: 50, w: 40, h: 30 };
    });

    const elev = floorElevators[floor.floorNumber] ?? { x: 80, y: 50, w: 70, h: 35 };
    seeds.push({
      roomCode: '__ELEVATOR__',
      x: elev.x,
      y: elev.y,
      w: elev.w,
      h: elev.h,
    });

    setDrafts(seeds);
  }, [isCalibrateMode, floor]);

  /* ---------- computed ---------- */

  const imgFile = floor?.mapImage
    ? extractFilename(floor.mapImage)
    : floorNumberToImage[floor?.floorNumber ?? 0] || 'image3.png';
  const naturalSize = floorImageSizes[imgFile] ?? { w: FLOOR_VIEW_WIDTH, h: FLOOR_VIEW_HEIGHT };
  const imgW = naturalSize.w;
  const imgH = naturalSize.h;

  /* ---------- calibration pointer handlers ---------- */

  const onPointerDown = useCallback(
    (e: React.PointerEvent, idx: number, type: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setActiveHandle({
        idx,
        type,
        startX: e.clientX,
        startY: e.clientY,
        origRect: { ...drafts[idx] },
      });
    },
    [drafts],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeHandle || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      // Convert client delta to pixel-space delta
      const scale = imgW / containerRect.width;
      const dx = (e.clientX - activeHandle.startX) * scale;
      const dy = (e.clientY - activeHandle.startY) * scale;

      setDrafts((prev) => {
        const next = [...prev];
        const orig = activeHandle.origRect;
        if (activeHandle.type === 'move') {
          next[activeHandle.idx] = {
            ...orig,
            x: Math.max(0, Math.round(orig.x + dx)),
            y: Math.max(0, Math.round(orig.y + dy)),
          };
        } else {
          next[activeHandle.idx] = {
            ...orig,
            w: Math.max(10, Math.round(orig.w + dx)),
            h: Math.max(10, Math.round(orig.h + dy)),
          };
        }
        return next;
      });
    },
    [activeHandle, imgW],
  );

  const onPointerUp = useCallback(() => setActiveHandle(null), []);

  const copyJson = () => {
    if (!floor) return;
    const roomLines: string[] = [];
    let elevatorLine = '';
    drafts.forEach((d) => {
      if (d.roomCode === '__ELEVATOR__') {
        elevatorLine = `  ${floor.floorNumber}: { x: ${d.x}, y: ${d.y}, w: ${d.w}, h: ${d.h} }, // ${imgFile}`;
      } else {
        roomLines.push(`  '${d.roomCode}': { x: ${d.x}, y: ${d.y}, w: ${d.w}, h: ${d.h} },`);
      }
    });

    let output = `// ${imgFile} (${imgW}×${imgH})\n// floorMaps:\n{\n${roomLines.join('\n')}\n}`;
    if (elevatorLine) {
      output += `\n\n// floorElevators:\n{\n${elevatorLine}\n}`;
    }
    navigator.clipboard?.writeText(output);
    alert('Copied! Dán vào floorMaps.ts để cập nhật.');
  };

  /* ---------- normal event handlers ---------- */

  const openPanel = (room: Room, e: React.MouseEvent | React.KeyboardEvent) => {
    if (isCalibrateMode) {
      setSelectedRoomCode(room.roomCode);
      return;
    }
    setHoveredRoom(room);
    const target = e.currentTarget as HTMLElement;
    const bbox = target.getBoundingClientRect();
    setTooltipPos({ x: bbox.left + bbox.width / 2, y: bbox.top + bbox.height + 10 });
  };

  const handleKeyDown = (e: React.KeyboardEvent, room: Room) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPanel(room, e);
    }
  };

  /* ---------- SVG click on <rect> ---------- */
  const handleSvgRectClick = (room: Room, e: React.MouseEvent<SVGRectElement>) => {
    if (isCalibrateMode) {
      setSelectedRoomCode(room.roomCode);
      return;
    }
    setHoveredRoom(room);
    const svgRect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    setTooltipPos({ x: svgRect.left + svgRect.width / 2, y: svgRect.top + svgRect.height + 10 });
  };

  const handleSvgRectKeyDown = (room: Room, e: React.KeyboardEvent<SVGRectElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const svgRect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
      if (isCalibrateMode) {
        setSelectedRoomCode(room.roomCode);
        return;
      }
      setHoveredRoom(room);
      setTooltipPos({ x: svgRect.left + svgRect.width / 2, y: svgRect.top + svgRect.height + 10 });
    }
  };

  /* ---------- touch handler ---------- */
  const handleSvgRectTouch = (room: Room, e: React.TouchEvent<SVGRectElement>) => {
    e.preventDefault();
    const svgRect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    if (isCalibrateMode) {
      setSelectedRoomCode(room.roomCode);
      return;
    }
    setHoveredRoom(room);
    setTooltipPos({ x: svgRect.left + svgRect.width / 2, y: svgRect.top + svgRect.height + 10 });
  };

  /* ---------- render: loading ---------- */

  if (isLoading && !floor) {
    return (
      <div className="w-full h-[500px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center border border-slate-200">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !floor) {
    return (
      <div className="w-full h-[300px] bg-rose-50 rounded-2xl flex flex-col items-center justify-center border border-rose-200 space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button
          onClick={() => fetchData()}
          className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!floor) return null;

  /* ---------- calibration overlay ---------- */

  if (isCalibrateMode) {
    return (
      <div className="relative rounded-2xl border border-slate-300 bg-slate-50 p-4 shadow-inner flex flex-col items-center overflow-hidden w-full">
        {/* Calibration toolbar */}
        <div className="w-full mb-4 p-4 bg-yellow-100 rounded-lg flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-yellow-800">
              Chế độ hiệu chỉnh — {imgFile} ({imgW}×{imgH} px)
            </h3>
            <button
              onClick={copyJson}
              className="px-3 py-1 bg-yellow-600 text-white rounded shadow text-sm flex gap-1 items-center"
            >
              <Copy className="w-4 h-4" /> Copy JSON
            </button>
          </div>
          {selectedRoomCode && (
            <div>
              <div className="text-xs font-semibold text-yellow-900 mb-1">
                Đang chỉnh: {selectedRoomCode === '__ELEVATOR__' ? 'Thang máy (__ELEVATOR__)' : `Phòng ${selectedRoomCode}`}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['x', 'y', 'w', 'h'] as const).map((field) => {
                  const draft = drafts.find((d) => d.roomCode === selectedRoomCode);
                  return (
                    <div key={field}>
                      <label className="text-xs">{field} (px)</label>
                      <input
                        type="number"
                        step="1"
                        className="w-full px-2 py-1 text-sm border rounded"
                        value={draft?.[field] ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setDrafts((prev) =>
                            prev.map((d) =>
                              d.roomCode === selectedRoomCode ? { ...d, [field]: val } : d,
                            ),
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Map with draggable rects */}
        <div
          ref={containerRef}
          className="relative w-full border border-slate-200 rounded-xl overflow-hidden shadow-md bg-white"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <img
            src={floor?.mapImage || `/assets/floors/${imgFile}`}
            alt={`Sơ đồ bản vẽ ${floor?.floorCode || ''}`}
            className="block w-full h-auto select-none"
            draggable={false}
          />
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${imgW} ${imgH}`}
            preserveAspectRatio="none"
          >
            {drafts.map((d, i) => {
              const isSelected = d.roomCode === selectedRoomCode;
              const isElevator = d.roomCode === '__ELEVATOR__';
              return (
                <g key={d.roomCode}>
                  {/* Main rect – draggable */}
                  <rect
                    x={d.x}
                    y={d.y}
                    width={d.w}
                    height={d.h}
                    fill={isElevator ? 'rgba(148, 163, 184, 0.4)' : 'rgba(59, 130, 246, 0.3)'}
                    stroke={isSelected ? '#1d4ed8' : isElevator ? '#64748b' : '#3b82f6'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="cursor-move"
                    onPointerDown={(e) => onPointerDown(e as unknown as React.PointerEvent, i, 'move')}
                    onClick={() => setSelectedRoomCode(d.roomCode)}
                  />
                  {/* Label */}
                  <text
                    x={d.x + 2}
                    y={d.y + 12}
                    fontSize="10"
                    fill={isElevator ? '#334155' : '#1e3a8a'}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {isElevator ? 'Thang máy' : d.roomCode}
                  </text>
                  {/* Resize handle */}
                  <rect
                    x={d.x + d.w - 8}
                    y={d.y + d.h - 8}
                    width={8}
                    height={8}
                    fill={isSelected ? '#1d4ed8' : '#64748b'}
                    className="cursor-se-resize"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onPointerDown(e as unknown as React.PointerEvent, i, 'resize');
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  /* ---------- normal render ---------- */

  return (
    <div className="relative rounded-2xl border border-slate-300 bg-slate-50 p-4 shadow-inner flex flex-col items-center justify-center overflow-hidden w-full">
      {/* Date & Time Picker */}
      <div className="w-full mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="datetime-input"
          />
          <input
            type="time"
            step="1800"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="datetime-input"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchData(true)}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
          </button>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Trống
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-rose-500" /> Đã Đặt
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500" /> Bảo Trì
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500" /> Bạn Đặt
            </div>
          </div>
        </div>
      </div>

      {/* Floor map with SVG overlay (plain background, no <img> in normal mode) */}
      <div
        className="relative w-full max-w-[390px] sm:max-w-[420px] mx-auto border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-100/80"
        style={{ aspectRatio: `${imgW} / ${imgH}` }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${imgW} ${imgH}`}
          preserveAspectRatio="none"
        >
          {/* Defs for gradients & patterns */}
          <defs>
            <pattern id="campus-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.75" />
            </pattern>
            <filter id="floor-shadow" x="-5%" y="-5%" width="115%" height="115%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Background grid (Khuôn viên ngoài trời / Khoảng sân bên ngoài chữ L) */}
          <rect width={imgW} height={imgH} fill="url(#campus-grid)" />

          {/* Building L-Shape Footprint (Hình dạng chữ L đồng bộ cố định cho tất cả các tầng) */}
          <g className="pointer-events-none select-none">
            <path
              d="M 16 16 H 404 V 132 H 216 V 434 H 16 Z"
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="5,4"
              strokeLinejoin="round"
              filter="url(#floor-shadow)"
            />
          </g>

          {/* Architectural Details: Thang bộ (Staircase - Cố định góc trên bên trái) */}
          <g role="img" aria-label="Thang bộ" className="pointer-events-none select-none">
            <rect
              x={28}
              y={26}
              width={50}
              height={34}
              rx={3}
              fill="#f1f5f9"
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            {/* Stair treads */}
            <line x1={38} y1={27} x2={38} y2={59} stroke="#cbd5e1" strokeWidth={1} />
            <line x1={48} y1={27} x2={48} y2={59} stroke="#cbd5e1" strokeWidth={1} />
            <line x1={58} y1={27} x2={58} y2={59} stroke="#cbd5e1" strokeWidth={1} />
            <line x1={68} y1={27} x2={68} y2={59} stroke="#cbd5e1" strokeWidth={1} />
            <text
              x={53}
              y={43}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={8}
              fontWeight="bold"
              fill="#475569"
            >
              Thang bộ
            </text>
          </g>

          {/* Architectural Details: Thang máy (Elevator - Cố định tuyệt đối góc trên bên trái) */}
          {(() => {
            const elev = floorElevators[floor.floorNumber] ?? { x: 84, y: 26, w: 68, h: 34 };
            return (
              <g role="img" aria-label="Thang máy" className="pointer-events-none select-none">
                <rect
                  x={elev.x}
                  y={elev.y}
                  width={elev.w}
                  height={elev.h}
                  rx={3}
                  fill="#e0e7ff"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                />
                {/* Double door line */}
                <line
                  x1={elev.x + elev.w / 2}
                  y1={elev.y + 2}
                  x2={elev.x + elev.w / 2}
                  y2={elev.y + elev.h - 2}
                  stroke="#818cf8"
                  strokeDasharray="2,2"
                  strokeWidth={1}
                />
                <text
                  x={elev.x + elev.w / 2}
                  y={elev.y + elev.h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight="bold"
                  fill="#3730a3"
                  className="select-none pointer-events-none"
                >
                  Thang máy
                </text>
              </g>
            );
          })()}

          {/* Architectural Details: Khu vệ sinh (WC - Cố định tuyệt đối góc trên bên trái) */}
          <g role="img" aria-label="Khu vệ sinh" className="pointer-events-none select-none">
            <rect
              x={28}
              y={66}
              width={50}
              height={34}
              rx={3}
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            <text
              x={53}
              y={83}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={8}
              fontWeight="bold"
              fill="#64748b"
            >
              WC
            </text>
          </g>

          {/* Architectural Details: Sảnh tầng (Elevator Lobby) */}
          <g role="img" aria-label="Sảnh tầng" className="pointer-events-none select-none">
            <rect
              x={84}
              y={66}
              width={68}
              height={34}
              rx={3}
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            <text
              x={118}
              y={83}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={8}
              fontWeight="semibold"
              fill="#94a3b8"
            >
              Sảnh tầng
            </text>
          </g>

          {/* Architectural Details: Hành lang đi lại (Hallway Circulation - Đồng bộ cố định tất cả các tầng) */}
          <g className="pointer-events-none select-none">
            <path
              d="M 180 300 V 108 H 375"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={265}
              y={108}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={7}
              fontWeight="bold"
              fill="#94a3b8"
              letterSpacing="2"
            >
              HÀNH LANG
            </text>
          </g>

          {/* Courtyard Architectural Info & North Compass (Khuôn viên ngoài trời) */}
          <g className="pointer-events-none select-none">
            {/* North Compass Arrow */}
            <g transform={`translate(${Math.round(imgW - 46)}, ${Math.round(imgH - 46)})`} opacity={0.85}>
              <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
              <polygon points="0,-12 4,2 0,0 -4,2" fill="#2563eb" />
              <polygon points="0,12 4,0 0,0 -4,0" fill="#94a3b8" />
              <text x="0" y="-14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1e40af">
                BẮC
              </text>
            </g>

            {/* Building Watermark in Courtyard (Dịch chuyển xuống dưới thoáng đãng, cân đối bên phải nhánh dọc) */}
            <g transform={`translate(${Math.round(imgW * 0.59)}, ${Math.round(imgH * 0.46)})`} opacity={0.45}>
              <rect x="-12" y="-14" width="134" height="48" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
              <text x="55" y="8" textAnchor="middle" fontSize="11" fontWeight="900" fill="#475569" letterSpacing="1">
                TÒA L • THƯ VIỆN
              </text>
              <text x="55" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
                {floor?.floorCode ? floor.floorCode.toUpperCase() : `TẦNG ${floor?.floorNumber ?? ''}`}
              </text>
            </g>
          </g>

          {/* Rooms */}
          {(floor?.rooms || []).map((room) => {
            const rect = floorMaps[room.roomCode];
            if (!rect) return null;
            const colors = getRoomColor(room.status, room.colorCode);
            const isSelected = hoveredRoom?.id === room.id;

            return (
              <g key={room.id}>
                {/* Room rectangle */}
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  rx={4}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 3 : 1.5}
                  role="button"
                  tabIndex={0}
                  aria-label={`Phòng ${room.roomCode} – ${colors.label}`}
                  className="pointer-events-auto cursor-pointer transition-all hover:opacity-85 outline-none focus-visible:stroke-blue-500 focus-visible:stroke-[3]"
                  onClick={(e) => handleSvgRectClick(room, e)}
                  onKeyDown={(e) => handleSvgRectKeyDown(room, e)}
                  onTouchEnd={(e) => handleSvgRectTouch(room, e)}
                  onMouseEnter={(e) => {
                    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
                    setTooltipPos({ x: r.left + r.width / 2, y: r.top - 8 });
                  }}
                  onFocus={(e) => {
                    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
                    setTooltipPos({ x: r.left + r.width / 2, y: r.top - 8 });
                  }}
                />

                {/* Room code label: centered horizontally & vertically */}
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + rect.h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={rect.w < 80 ? 10 : 11}
                  fontWeight="bold"
                  fill={colors.text}
                  className="pointer-events-none select-none font-bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {room.roomCode}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating tooltip (hover/focus only, no room code text on the map) */}
      {hoveredRoom && !isCalibrateMode && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setHoveredRoom(null)}
          />
          <div
            style={{
              position: 'fixed',
              left: `${Math.min(Math.max(tooltipPos.x, 150), window.innerWidth - 150)}px`,
              top: `${tooltipPos.y}px`,
              transform: 'translate(-50%, 0)',
            }}
            className="z-50 w-72 bg-white text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200 animate-fade-in pointer-events-auto space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm">{hoveredRoom.roomCode}</h4>
              <StatusBadge status={hoveredRoom.status} />
            </div>

            <div className="text-xs space-y-1 text-slate-600 font-medium">
              <div className="font-bold text-slate-800">{hoveredRoom.roomType}</div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Sức chứa: {minOccupancy(hoveredRoom.capacity)} - {hoveredRoom.capacity} người
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span className="flex-1">
                  Thiết bị:{' '}
                  {hoveredRoom.devices.map((d) => `${d.name} (${d.status})`).join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Giờ mở cửa: {(floor?.floorNumber ?? 0) <= 2 ? '07:30 - 20:00' : '07:30 - 17:00'}
                </span>
              </div>
            </div>

            {hoveredRoom.status === 'AVAILABLE' && (
              <button
                onClick={() => {
                  setHoveredRoom(null);
                  onBookRoom(hoveredRoom, selectedDate, selectedTime);
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Đặt phòng này</span>
              </button>
            )}

            {hoveredRoom.status === 'BOOKED' && (
              <div className="space-y-2">
                <div className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100 text-center">
                  Phòng đã có người đặt trong khung giờ này
                </div>
                {onViewSchedule && (
                  <button
                    onClick={() => {
                      setHoveredRoom(null);
                      onViewSchedule(hoveredRoom);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Xem lịch bận để chọn giờ khác</span>
                  </button>
                )}
              </div>
            )}

            {hoveredRoom.status === 'MAINTENANCE' && (
              <div className="text-[10px] text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200 text-center">
                Phòng đang bảo trì. Xin lỗi vì sự bất tiện này.
              </div>
            )}

            {hoveredRoom.status === 'SELF_BOOKED' && (
              <div className="text-[10px] text-blue-700 font-bold bg-blue-50 p-2 rounded-lg border border-blue-200 text-center">
                Bạn đã đặt phòng này vào khung giờ này.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
