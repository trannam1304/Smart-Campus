// src/data/floorMaps.ts
// Pixel-based room rectangles standardized for the L-shaped building layout.
// Khung bao tòa nhà hình chữ L lật lên phía trên (inverted-L shape) đồng bộ cố định cho tất cả các tầng.

/** Kích thước viewBox chuẩn cố định cho tất cả các tầng (420 × 450). */
export const FLOOR_VIEW_WIDTH = 420;
export const FLOOR_VIEW_HEIGHT = 450;

/** Rectangle in the floor-plan (pixel coordinates). */
export interface RoomRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Natural pixel size of each floor-plan PNG.
 * Đồng bộ kích thước chuẩn cố định 420 × 450 cho tất cả các tầng để không thay đổi tỷ lệ khi chuyển tầng.
 */
export const floorImageSizes: Record<string, { w: number; h: number }> = {
  'image3.png': { w: FLOOR_VIEW_WIDTH, h: FLOOR_VIEW_HEIGHT }, // Tầng G
  'image4.png': { w: FLOOR_VIEW_WIDTH, h: FLOOR_VIEW_HEIGHT }, // Tầng 1
  'image5.png': { w: FLOOR_VIEW_WIDTH, h: FLOOR_VIEW_HEIGHT }, // Tầng 2
  'image6.png': { w: FLOOR_VIEW_WIDTH, h: FLOOR_VIEW_HEIGHT }, // Tầng 3
  'image7.png': { w: FLOOR_VIEW_WIDTH, h: FLOOR_VIEW_HEIGHT }, // Tầng 4
  'image8.png': { w: FLOOR_VIEW_WIDTH, h: FLOOR_VIEW_HEIGHT }, // Tầng 5
};

/**
 * Vị trí cố định tuyệt đối của Thang máy trên tất cả các tầng:
 * x: 84, y: 26, w: 68, h: 34
 * Đặt cạnh Thang bộ (x: 28, y: 26, w: 50, h: 34) và WC (x: 28, y: 66, w: 50, h: 34).
 */
export const floorElevators: Record<number, RoomRect> = {
  0: { x: 84, y: 26, w: 68, h: 34 },
  1: { x: 84, y: 26, w: 68, h: 34 },
  2: { x: 84, y: 26, w: 68, h: 34 },
  3: { x: 84, y: 26, w: 68, h: 34 },
  4: { x: 84, y: 26, w: 68, h: 34 },
  5: { x: 84, y: 26, w: 68, h: 34 },
};

/**
 * Toạ độ các phòng được chuẩn hóa gọn gàng bên trong khung viền chữ L (M 16 16 H 404 V 132 H 216 V 434 H 16 Z):
 * - Nhánh ngang phía trên (x: 164..396, y: 26..86):
 *   + Tầng có 2 phòng (G, 1, 2, 5): chia đều 2 phòng w: 110 (L.x01: 164..274, L.x02: 286..396)
 *   + Tầng có 3 phòng (3, 4): chia đều 3 phòng w: 72 (L.x01: 164..236, L.x02: 244..316, L.x03: 324..396, không tràn lề)
 * - Nhánh dọc bên trái (x: 28..143 tiêu chuẩn, x: 28..204 cho phòng hội nghị lớn L.106/L.506):
 *   + Các phòng tiêu chuẩn w: 115, nằm gọn gàng có padding đều đặn.
 */
export const floorMaps: Record<string, RoomRect> = {
  // ── Tầng G (G - Floor) ──────────────────────────────────
  // Nhánh ngang 2 phòng học nhóm:
  'L.001': { x: 164, y: 26, w: 110, h: 60 },
  'L.002': { x: 286, y: 26, w: 110, h: 60 },
  // Nhánh dọc: L.003, L.005 (Phòng thuyết trình) & L.004 (Phòng video):
  'L.003': { x: 28, y: 120, w: 115, h: 88 },
  'L.004': { x: 28, y: 218, w: 115, h: 88 },
  'L.005': { x: 28, y: 316, w: 115, h: 88 },

  // ── Tầng 1 (1st - Floor) ────────────────────────────────
  // Nhánh ngang 2 phòng học nhóm:
  'L.101': { x: 164, y: 26, w: 110, h: 60 },
  'L.102': { x: 286, y: 26, w: 110, h: 60 },
  // Nhánh dọc: L.103 (Phòng học nhóm), L.104, L.105 (Phòng thuyết trình) & L.106 (Phòng hội nghị):
  'L.103': { x: 28, y: 120, w: 115, h: 58 },
  'L.104': { x: 28, y: 186, w: 115, h: 58 },
  'L.105': { x: 28, y: 252, w: 115, h: 58 },
  'L.106': { x: 28, y: 320, w: 176, h: 104 },

  // ── Tầng 2 (2nd - Floor) ────────────────────────────────
  // Nhánh ngang 2 phòng học nhóm:
  'L.201': { x: 164, y: 26, w: 110, h: 60 },
  'L.202': { x: 286, y: 26, w: 110, h: 60 },
  // Nhánh dọc: L.203 (Phòng video) & L.204 (Phòng thuyết trình):
  'L.203': { x: 28, y: 140, w: 115, h: 100 },
  'L.204': { x: 28, y: 260, w: 115, h: 100 },

  // ── Tầng 3 (3rd - Floor) ────────────────────────────────
  // Nhánh ngang 3 phòng tự học:
  'L.301': { x: 164, y: 26, w: 72, h: 60 },
  'L.302': { x: 244, y: 26, w: 72, h: 60 },
  'L.303': { x: 324, y: 26, w: 72, h: 60 },
  // Nhánh dọc: L.304 (Phòng video), L.305 (Phòng thuyết trình), L.306 (Phòng học nhóm):
  'L.304': { x: 28, y: 120, w: 115, h: 88 },
  'L.305': { x: 28, y: 218, w: 115, h: 88 },
  'L.306': { x: 28, y: 316, w: 115, h: 88 },

  // ── Tầng 4 (4th - Floor) ────────────────────────────────
  // Nhánh ngang 3 phòng tự học:
  'L.401': { x: 164, y: 26, w: 72, h: 60 },
  'L.402': { x: 244, y: 26, w: 72, h: 60 },
  'L.403': { x: 324, y: 26, w: 72, h: 60 },
  // Nhánh dọc: L.404, L.406 (Phòng thuyết trình) & L.405 (Phòng video):
  'L.404': { x: 28, y: 120, w: 115, h: 88 },
  'L.405': { x: 28, y: 218, w: 115, h: 88 },
  'L.406': { x: 28, y: 316, w: 115, h: 88 },

  // ── Tầng 5 (5th - Floor) ────────────────────────────────
  // Nhánh ngang 2 phòng học nhóm:
  'L.501': { x: 164, y: 26, w: 110, h: 60 },
  'L.502': { x: 286, y: 26, w: 110, h: 60 },
  // Nhánh dọc: L.503 (Phòng video), L.504, L.505 (Phòng thuyết trình) & L.506 (Phòng hội nghị):
  'L.503': { x: 28, y: 120, w: 115, h: 58 },
  'L.504': { x: 28, y: 186, w: 115, h: 58 },
  'L.505': { x: 28, y: 252, w: 115, h: 58 },
  'L.506': { x: 28, y: 320, w: 176, h: 104 },
};
