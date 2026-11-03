// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal component', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  it('renders correctly with title, children and footer', () => {
    const handleClose = vi.fn();
    render(
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Tiêu đề Modal"
        subtitle="Mô tả phụ"
        footer={<button>Nút Đáy</button>}
      >
        <p>Nội dung thân modal</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Tiêu đề Modal')).toBeDefined();
    expect(screen.getByText('Mô tả phụ')).toBeDefined();
    expect(screen.getByText('Nội dung thân modal')).toBeDefined();
    expect(screen.getByText('Nút Đáy')).toBeDefined();
  });

  it('locks body scroll when opened and restores on close', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Lock">
        <p>Testing scroll lock</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test Lock">
        <p>Testing scroll lock</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('calls onClose when clicking backdrop overlay', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Backdrop Test">
        <p>Click backdrop</p>
      </Modal>
    );

    // The overlay is the root fixed element
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement!;

    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Clicking inside the modal dialog does not trigger close
    fireEvent.click(dialog);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape key', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Test">
        <p>Press Esc</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
