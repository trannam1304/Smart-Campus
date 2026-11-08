import { describe, it, expect } from 'vitest';
import { floorMaps, floorElevators, floorImageSizes, type RoomRect } from './floorMaps';
import { testRooms as mockExactRooms } from '../test/testFixtures';

// ── helpers ──────────────────────────────────────────────────

/** Map floor number → image filename */
const floorNumberToImage: Record<number, string> = {
  0: 'image3.png',
  1: 'image4.png',
  2: 'image5.png',
  3: 'image6.png',
  4: 'image7.png',
  5: 'image8.png',
};

/** Get image size for a room code based on its floor prefix */
const getImageForRoom = (code: string): { w: number; h: number } | undefined => {
  const match = code.match(/^L\.(\d)/);
  if (!match) return undefined;
  const floorDigit = match[1];
  const floorNumber = floorDigit === '0' ? 0 : parseInt(floorDigit, 10);
  const imgFile = floorNumberToImage[floorNumber];
  return imgFile ? floorImageSizes[imgFile] : undefined;
};

/** Check if two rects overlap more than `tolerance` pixels in both axes */
const rectsOverlap = (a: RoomRect, b: RoomRect, tolerance: number): boolean => {
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return overlapX > tolerance && overlapY > tolerance;
};

// ── tests ────────────────────────────────────────────────────

describe('floorMaps', () => {
  const allMockRoomCodes = mockExactRooms.map((r) => r.roomCode);
  const allMapCodes = Object.keys(floorMaps);

  it('every room code in mock data has a rect in floorMaps', () => {
    const missing = allMockRoomCodes.filter((code) => !floorMaps[code]);
    expect(missing, `Missing rects for: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('every room code in floorMaps exists in mock data', () => {
    const extra = allMapCodes.filter(
      (code) => !allMockRoomCodes.includes(code),
    );
    expect(extra, `Extra rects without mock data: ${extra.join(', ')}`).toHaveLength(0);
  });

  it.each(allMapCodes)('rect for %s lies within image bounds', (code) => {
    const rect = floorMaps[code];
    const img = getImageForRoom(code);
    expect(img, `No image found for room ${code}`).toBeDefined();
    if (!img) return;

    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.w).toBeGreaterThan(0);
    expect(rect.h).toBeGreaterThan(0);
    expect(rect.x + rect.w).toBeLessThanOrEqual(img.w);
    expect(rect.y + rect.h).toBeLessThanOrEqual(img.h);
  });

  /** Group rooms by floor and check no two rects on the same floor overlap > 2px */
  it('no two rects on the same floor overlap more than 2px', () => {
    const byFloor = new Map<number, { code: string; rect: RoomRect }[]>();

    for (const code of allMapCodes) {
      const match = code.match(/^L\.(\d)/);
      if (!match) continue;
      const floorDigit = match[1];
      const floorNumber = floorDigit === '0' ? 0 : parseInt(floorDigit, 10);

      if (!byFloor.has(floorNumber)) byFloor.set(floorNumber, []);
      byFloor.get(floorNumber)!.push({ code, rect: floorMaps[code] });
    }

    const violations: string[] = [];

    byFloor.forEach((rooms, floorNumber) => {
      for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
          if (rectsOverlap(rooms[i].rect, rooms[j].rect, 2)) {
            violations.push(
              `Floor ${floorNumber}: ${rooms[i].code} overlaps with ${rooms[j].code}`,
            );
          }
        }
      }
    });

    expect(violations, violations.join('\n')).toHaveLength(0);
  });
});

describe('floorElevators', () => {
  const expectedFloors = [0, 1, 2, 3, 4, 5];

  it('every floor 0..5 has a floorElevators entry', () => {
    for (const floor of expectedFloors) {
      expect(floorElevators[floor], `Missing elevator for floor ${floor}`).toBeDefined();
    }
  });

  it.each(expectedFloors)('elevator for floor %d lies within image bounds', (floor) => {
    const rect = floorElevators[floor];
    const imgFile = floorNumberToImage[floor];
    const img = floorImageSizes[imgFile];
    expect(img, `Missing image size for floor ${floor}`).toBeDefined();

    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.w).toBeGreaterThan(0);
    expect(rect.h).toBeGreaterThan(0);
    expect(rect.x + rect.w).toBeLessThanOrEqual(img.w);
    expect(rect.y + rect.h).toBeLessThanOrEqual(img.h);
  });

  it.each(expectedFloors)('elevator for floor %d does not overlap with any room rect on that floor', (floor) => {
    const elev = floorElevators[floor];
    const prefix = floor === 0 ? 'L.0' : `L.${floor}`;
    const roomsOnFloor = Object.entries(floorMaps).filter(([code]) => code.startsWith(prefix));

    for (const [code, roomRect] of roomsOnFloor) {
      const overlaps = rectsOverlap(elev, roomRect, 0);
      expect(overlaps, `Elevator on floor ${floor} overlaps with room ${code}`).toBe(false);
    }
  });
});
