import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseActiveFloorOptions {
  rootMargin?: string;
}

export interface UseActiveFloorResult {
  activeFloor: number | null;
  setActiveFloor: (floor: number | null) => void;
  setClickedFloor: (floor: number) => void;
}

/**
 * Hook theo dõi tầng đang hiển thị trên khung nhìn bằng IntersectionObserver.
 * - rootMargin mặc định '-20% 0px -65% 0px' để bắt section gần đỉnh màn hình.
 * - Tự động cập nhật khi sectionIds thay đổi (lọc, tìm kiếm).
 * - Dọn dẹp observer khi unmount.
 * - Bỏ qua êm đẹp nếu môi trường không có IntersectionObserver (jsdom/test).
 * - Khóa ưu tiên tầng vừa bấm (setClickedFloor) cho tới khi cuộn xong (scrollend hoặc 1s) tránh nhấp nháy.
 */
export function useActiveFloor(
  sectionIds: string[],
  options?: UseActiveFloorOptions
): UseActiveFloorResult {
  const [activeFloor, setActiveFloor] = useState<number | null>(() => {
    if (sectionIds.length === 0) return null;
    const firstMatch = sectionIds[0].match(/^floor-(\d+)$/);
    return firstMatch ? parseInt(firstMatch[1], 10) : null;
  });

  const isManualScrollingRef = useRef(false);
  const manualTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rootMargin = options?.rootMargin ?? '-20% 0px -65% 0px';

  // Khi danh sách section thay đổi (tìm kiếm / bộ lọc), đồng bộ lại tầng active
  useEffect(() => {
    if (sectionIds.length === 0) {
      setActiveFloor(null);
      return;
    }

    const currentId = activeFloor !== null ? `floor-${activeFloor}` : null;
    if (!currentId || !sectionIds.includes(currentId)) {
      const match = sectionIds[0].match(/^floor-(\d+)$/);
      if (match) {
        setActiveFloor(parseInt(match[1], 10));
      }
    }
  }, [sectionIds, activeFloor]);

  // Khóa highlight vào tầng được bấm trong khi cuộn mượt
  const setClickedFloor = useCallback((floor: number) => {
    isManualScrollingRef.current = true;
    setActiveFloor(floor);

    if (manualTimeoutRef.current) {
      clearTimeout(manualTimeoutRef.current);
    }
    manualTimeoutRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 1000);
  }, []);

  // Lắng nghe sự kiện scrollend để mở khóa sớm khi cuộn xong
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScrollEnd = () => {
      if (isManualScrollingRef.current) {
        if (manualTimeoutRef.current) {
          clearTimeout(manualTimeoutRef.current);
        }
        isManualScrollingRef.current = false;
      }
    };

    window.addEventListener('scrollend', handleScrollEnd);
    return () => {
      window.removeEventListener('scrollend', handleScrollEnd);
      if (manualTimeoutRef.current) {
        clearTimeout(manualTimeoutRef.current);
      }
    };
  }, []);

  // IntersectionObserver
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    if (sectionIds.length === 0) return;

    const visibleMap = new Map<string, IntersectionObserverEntry>();

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrollingRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleMap.set(entry.target.id, entry);
          } else {
            visibleMap.delete(entry.target.id);
          }
        });

        // Chọn section đầu tiên theo thứ tự sectionIds đang nằm trong vùng quan sát
        for (const id of sectionIds) {
          if (visibleMap.has(id)) {
            const match = id.match(/^floor-(\d+)$/);
            if (match) {
              const floorNum = parseInt(match[1], 10);
              setActiveFloor(floorNum);
              break;
            }
          }
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, rootMargin]);

  return {
    activeFloor,
    setActiveFloor,
    setClickedFloor,
  };
}
