import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZoomControls } from './ZoomControls';

describe('ZoomControls', () => {
  it('should render zoom controls with current zoom percentage', () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onResetZoom: vi.fn(),
    };

    render(
      <ZoomControls
        zoomPercent="150%"
        {...mockHandlers}
      />
    );

    expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('should call onZoomIn when zoom in button is clicked', async () => {
    const user = userEvent.setup();
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onResetZoom: vi.fn(),
    };

    render(
      <ZoomControls
        zoomPercent="100%"
        {...mockHandlers}
      />
    );

    const zoomInButton = screen.getByTestId('zoom-in-button');
    await user.click(zoomInButton);

    expect(mockHandlers.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('should call onZoomOut when zoom out button is clicked', async () => {
    const user = userEvent.setup();
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onResetZoom: vi.fn(),
    };

    render(
      <ZoomControls
        zoomPercent="100%"
        {...mockHandlers}
      />
    );

    const zoomOutButton = screen.getByTestId('zoom-out-button');
    await user.click(zoomOutButton);

    expect(mockHandlers.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('should call onResetZoom when reset button is clicked', async () => {
    const user = userEvent.setup();
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onResetZoom: vi.fn(),
    };

    render(
      <ZoomControls
        zoomPercent="200%"
        {...mockHandlers}
      />
    );

    const resetButton = screen.getByTestId('zoom-reset-button');
    await user.click(resetButton);

    expect(mockHandlers.onResetZoom).toHaveBeenCalledTimes(1);
  });

  it('should call onResetZoom when reset icon button is clicked', async () => {
    const user = userEvent.setup();
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onResetZoom: vi.fn(),
    };

    render(
      <ZoomControls
        zoomPercent="200%"
        {...mockHandlers}
      />
    );

    const resetIconButton = screen.getByTestId('zoom-reset-icon-button');
    await user.click(resetIconButton);

    expect(mockHandlers.onResetZoom).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onResetZoom: vi.fn(),
    };

    render(
      <ZoomControls
        zoomPercent="100%"
        {...mockHandlers}
        className="custom-class"
      />
    );

    const controls = screen.getByTestId('zoom-controls');
    expect(controls).toHaveClass('custom-class');
  });
});
