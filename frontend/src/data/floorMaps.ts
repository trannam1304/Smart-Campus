export interface RoomRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const floorMaps: Record<string, RoomRect> = {
  // Tầng G (431x617)
  'L.001': { top: 29.173, left: 8.817, width: 25.986, height: 9.562 },
  'L.002': { top: 38.735, left: 8.817, width: 25.986, height: 9.562 },
  'L.003': { top: 48.298, left: 8.817, width: 25.986, height: 9.562 },
  'L.004': { top: 57.860, left: 8.817, width: 25.986, height: 9.562 },
  'L.005': { top: 67.423, left: 8.817, width: 25.986, height: 9.562 },

  // Dummy cho các tầng khác - Cần dùng công cụ calibrate để căn chỉnh
  'L.101': { top: 10, left: 10, width: 20, height: 10 },
  'L.102': { top: 25, left: 10, width: 20, height: 10 },
  'L.103': { top: 40, left: 10, width: 20, height: 10 },
  'L.104': { top: 55, left: 10, width: 20, height: 10 },
  'L.105': { top: 70, left: 10, width: 20, height: 10 },
  'L.106': { top: 85, left: 10, width: 20, height: 10 },
  
  'L.201': { top: 10, left: 10, width: 20, height: 10 },
  'L.202': { top: 25, left: 10, width: 20, height: 10 },
  'L.203': { top: 40, left: 10, width: 20, height: 10 },
  'L.204': { top: 55, left: 10, width: 20, height: 10 },
  
  'L.301': { top: 10, left: 10, width: 20, height: 10 },
  'L.302': { top: 25, left: 10, width: 20, height: 10 },
  'L.303': { top: 40, left: 10, width: 20, height: 10 },
  'L.304': { top: 55, left: 10, width: 20, height: 10 },
  'L.305': { top: 70, left: 10, width: 20, height: 10 },
  'L.306': { top: 85, left: 10, width: 20, height: 10 },

  'L.401': { top: 10, left: 10, width: 20, height: 10 },
  'L.402': { top: 25, left: 10, width: 20, height: 10 },
  'L.403': { top: 40, left: 10, width: 20, height: 10 },
  'L.404': { top: 55, left: 10, width: 20, height: 10 },
  'L.405': { top: 70, left: 10, width: 20, height: 10 },
  'L.406': { top: 85, left: 10, width: 20, height: 10 },

  'L.501': { top: 10, left: 10, width: 20, height: 10 },
  'L.502': { top: 25, left: 10, width: 20, height: 10 },
  'L.503': { top: 40, left: 10, width: 20, height: 10 },
  'L.504': { top: 55, left: 10, width: 20, height: 10 },
  'L.505': { top: 70, left: 10, width: 20, height: 10 },
  'L.506': { top: 85, left: 10, width: 20, height: 10 },
};
