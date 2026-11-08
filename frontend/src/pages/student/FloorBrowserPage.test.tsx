// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FloorBrowserPage } from './FloorBrowserPage';
import { AuthProvider } from '../../context/AuthContext';
import { BookingProvider } from '../../context/BookingContext';
import { ToastProvider } from '../../hooks/useToast';
import { mockStore } from '../../api/mock/mockStore';

describe('FloorBrowserPage', () => {
  let scrollIntoViewMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStore.reset();
    vi.clearAllMocks();
    scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <BookingProvider>
              <FloorBrowserPage />
            </BookingProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('không còn ô dropdown chọn tầng ("Tất cả tầng"), chỉ dùng thanh điều hướng tầng', async () => {
    renderComponent();

    // Chờ danh sách phòng được load
    await waitFor(() => {
      expect(screen.getByText(/Tầng G – Sảnh Đọc/i)).toBeTruthy();
    });

    // Không còn option "Tất cả tầng" trong bất kỳ select nào
    expect(screen.queryByText('Tất cả tầng')).toBeNull();

    // Vẫn còn dropdown chọn trạng thái
    expect(screen.getByText('Tất cả trạng thái')).toBeTruthy();
  });

  it('gắn id="floor-{floorNumber}" cho từng section tầng và có class scroll-mt', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Tầng G – Sảnh Đọc/i)).toBeTruthy();
    });

    const floor0 = document.getElementById('floor-0');
    const floor1 = document.getElementById('floor-1');
    const floor2 = document.getElementById('floor-2');

    expect(floor0).not.toBeNull();
    expect(floor1).not.toBeNull();
    expect(floor2).not.toBeNull();

    expect(floor0?.className).toContain('scroll-mt-');
  });

  it('bấm nút tầng trên FloorNavBar sẽ gọi scrollIntoView với smooth và block start', async () => {
    // prefers-reduced-motion: false
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Tầng G – Sảnh Đọc/i)).toBeTruthy();
    });

    const btnFloor1 = screen.getByRole('button', { name: 'Tầng 1' });
    fireEvent.click(btnFloor1);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    // Phần tử được gọi scrollIntoView chính là section floor-1
    expect(scrollIntoViewMock.mock.instances[0]).toBe(document.getElementById('floor-1'));
  });

  it('khi người dùng bật prefers-reduced-motion thì cuộn với behavior "auto"', async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Tầng G – Sảnh Đọc/i)).toBeTruthy();
    });

    const btnFloor2 = screen.getByRole('button', { name: 'Tầng 2' });
    fireEvent.click(btnFloor2);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    });
    expect(scrollIntoViewMock.mock.instances[0]).toBe(document.getElementById('floor-2'));
  });

  it('khi lọc từ khóa làm một tầng không có phòng nào thì nút tầng đó bị vô hiệu hóa (disabled)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Tầng G – Sảnh Đọc/i)).toBeTruthy();
    });

    // Tìm kiếm phòng L.101 (chỉ có ở tầng 1)
    const searchInput = screen.getByPlaceholderText(/Tìm theo mã phòng/i);
    fireEvent.change(searchInput, { target: { value: 'L.101' } });

    // Tầng 1 vẫn mở, còn các tầng khác (G, 2, 3, 4, 5) bị disable
    const btnFloor1 = screen.getByRole('button', { name: 'Tầng 1' }) as HTMLButtonElement;
    const btnFloorG = screen.getByRole('button', { name: 'Tầng G' }) as HTMLButtonElement;
    const btnFloor2 = screen.getByRole('button', { name: 'Tầng 2' }) as HTMLButtonElement;

    expect(btnFloor1.disabled).toBe(false);
    expect(btnFloorG.disabled).toBe(true);
    expect(btnFloor2.disabled).toBe(true);
  });
});
