// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveFloor } from './useActiveFloor';

describe('useActiveFloor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('khởi tạo với tầng đầu tiên trong danh sách sectionIds', () => {
    const { result } = renderHook(() => useActiveFloor(['floor-0', 'floor-1', 'floor-2']));
    expect(result.current.activeFloor).toBe(0);
  });

  it('trả về null khi sectionIds rỗng', () => {
    const { result } = renderHook(() => useActiveFloor([]));
    expect(result.current.activeFloor).toBe(null);
  });

  it('setClickedFloor cập nhật activeFloor ngay lập tức và giữ khóa chống nhấp nháy', () => {
    const { result } = renderHook(() => useActiveFloor(['floor-0', 'floor-1', 'floor-2']));

    act(() => {
      result.current.setClickedFloor(2);
    });

    expect(result.current.activeFloor).toBe(2);

    // Tiến hành hết 1000ms timeout mở khóa
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.activeFloor).toBe(2);
  });

  it('hoạt động bình thường và dọn dẹp khi có IntersectionObserver', () => {
    const observeMock = vi.fn();
    const disconnectMock = vi.fn();

    let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};

    class MockIntersectionObserver {
      constructor(callback: any) {
        observerCallback = callback;
      }
      observe = observeMock;
      unobserve = vi.fn();
      disconnect = disconnectMock;
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    // Tạo các phần tử giả lập trên DOM
    const div0 = document.createElement('div');
    div0.id = 'floor-0';
    document.body.appendChild(div0);

    const div1 = document.createElement('div');
    div1.id = 'floor-1';
    document.body.appendChild(div1);

    const { result, unmount } = renderHook(() =>
      useActiveFloor(['floor-0', 'floor-1'])
    );

    expect(observeMock).toHaveBeenCalledWith(div0);
    expect(observeMock).toHaveBeenCalledWith(div1);

    // Kích hoạt callback khi floor-1 lọt vào vùng quan sát
    act(() => {
      observerCallback([
        { target: div0, isIntersecting: false },
        { target: div1, isIntersecting: true },
      ]);
    });

    expect(result.current.activeFloor).toBe(1);

    unmount();
    expect(disconnectMock).toHaveBeenCalled();

    // Dọn dẹp DOM
    document.body.removeChild(div0);
    document.body.removeChild(div1);
    vi.unstubAllGlobals();
  });
});
