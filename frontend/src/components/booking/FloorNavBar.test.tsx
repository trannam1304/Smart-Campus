// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FloorNavBar } from './FloorNavBar';

afterEach(() => {
  cleanup();
});

describe('FloorNavBar', () => {
  const defaultFloors = [
    { floorNumber: 0, label: 'G', disabled: false },
    { floorNumber: 1, label: '1', disabled: false },
    { floorNumber: 2, label: '2', disabled: true },
    { floorNumber: 3, label: '3', disabled: false },
    { floorNumber: 4, label: '4', disabled: false },
    { floorNumber: 5, label: '5', disabled: false },
  ];

  it('render đủ 6 nút với text G, 1, 2, 3, 4, 5 và aria-label tương ứng', () => {
    const handleSelect = vi.fn();
    render(<FloorNavBar floors={defaultFloors} activeFloor={0} onSelect={handleSelect} />);

    expect(screen.getByRole('button', { name: 'Tầng G' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tầng 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tầng 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tầng 3' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tầng 4' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tầng 5' })).toBeTruthy();

    expect(screen.getByRole('button', { name: 'Tầng G' }).textContent).toBe('G');
    expect(screen.getByRole('button', { name: 'Tầng 1' }).textContent).toBe('1');
    expect(screen.getByRole('button', { name: 'Tầng 2' }).textContent).toBe('2');
    expect(screen.getByRole('button', { name: 'Tầng 3' }).textContent).toBe('3');
    expect(screen.getByRole('button', { name: 'Tầng 4' }).textContent).toBe('4');
    expect(screen.getByRole('button', { name: 'Tầng 5' }).textContent).toBe('5');
  });

  it('gắn aria-current="true" cho tầng đang xem (activeFloor)', () => {
    const handleSelect = vi.fn();
    render(<FloorNavBar floors={defaultFloors} activeFloor={3} onSelect={handleSelect} />);

    const btn3 = screen.getByRole('button', { name: 'Tầng 3' });
    expect(btn3.getAttribute('aria-current')).toBe('true');

    const btn1 = screen.getByRole('button', { name: 'Tầng 1' });
    expect(btn1.getAttribute('aria-current')).toBeNull();
  });

  it('vô hiệu hóa nút khi disabled=true và không kích hoạt onSelect', () => {
    const handleSelect = vi.fn();
    render(<FloorNavBar floors={defaultFloors} activeFloor={0} onSelect={handleSelect} />);

    const btn2 = screen.getByRole('button', { name: 'Tầng 2' }) as HTMLButtonElement;
    expect(btn2.disabled).toBe(true);

    fireEvent.click(btn2);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('gọi onSelect với đúng số tầng khi bấm vào nút khả dụng', () => {
    const handleSelect = vi.fn();
    render(<FloorNavBar floors={defaultFloors} activeFloor={0} onSelect={handleSelect} />);

    const btn4 = screen.getByRole('button', { name: 'Tầng 4' });
    fireEvent.click(btn4);
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(4);

    const btnG = screen.getByRole('button', { name: 'Tầng G' });
    fireEvent.click(btnG);
    expect(handleSelect).toHaveBeenCalledTimes(2);
    expect(handleSelect).toHaveBeenCalledWith(0);
  });
});
