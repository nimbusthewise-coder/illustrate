import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createBuffer, setCell } from "@illustrate.md/core";
import { Canvas } from "./Canvas";

describe("Canvas", () => {
  it("renders without crashing", () => {
    const buffer = createBuffer(10, 5);
    const { container } = render(<Canvas buffer={buffer} />);
    const grid = container.querySelector('[data-testid="canvas-grid"]');
    expect(grid).toBeInTheDocument();
  });

  it("renders correct number of cells", () => {
    const buffer = createBuffer(4, 3);
    const { container } = render(<Canvas buffer={buffer} />);
    // 4 cols × 3 rows = 12 spans
    const cells = container.querySelectorAll("span[data-col]");
    expect(cells).toHaveLength(12);
  });

  it("displays character content from buffer", () => {
    const buffer = createBuffer(3, 1);
    setCell(buffer, 0, 0, { char: "A".codePointAt(0)! });
    setCell(buffer, 1, 0, { char: "B".codePointAt(0)! });
    setCell(buffer, 2, 0, { char: "C".codePointAt(0)! });

    const { container } = render(<Canvas buffer={buffer} />);
    const cells = container.querySelectorAll("span[data-col]");
    expect(cells[0].textContent).toBe("A");
    expect(cells[1].textContent).toBe("B");
    expect(cells[2].textContent).toBe("C");
  });

  it("reflects buffer changes when re-rendered with new buffer", () => {
    const buffer1 = createBuffer(2, 1);
    setCell(buffer1, 0, 0, { char: "X".codePointAt(0)! });

    const { container, rerender } = render(<Canvas buffer={buffer1} />);
    let cells = container.querySelectorAll("span[data-col]");
    expect(cells[0].textContent).toBe("X");

    // Create a new buffer with different content
    const buffer2 = createBuffer(2, 1);
    setCell(buffer2, 0, 0, { char: "Y".codePointAt(0)! });
    setCell(buffer2, 1, 0, { char: "Z".codePointAt(0)! });

    rerender(<Canvas buffer={buffer2} />);
    cells = container.querySelectorAll("span[data-col]");
    expect(cells[0].textContent).toBe("Y");
    expect(cells[1].textContent).toBe("Z");
  });

  it("applies grid styles when showGrid is true", () => {
    const buffer = createBuffer(2, 2);
    const { container } = render(<Canvas buffer={buffer} showGrid />);
    const grid = container.querySelector('[data-testid="canvas-grid"]');
    expect(grid).toBeInTheDocument();
    // Grid overlay div should be present
    const overlay = grid?.querySelector(".pointer-events-none");
    expect(overlay).toBeInTheDocument();
  });

  it("does not show grid overlay when showGrid is false", () => {
    const buffer = createBuffer(2, 2);
    const { container } = render(<Canvas buffer={buffer} showGrid={false} />);
    const grid = container.querySelector('[data-testid="canvas-grid"]');
    const overlay = grid?.querySelector(".pointer-events-none");
    expect(overlay).toBeNull();
  });

  it("sets correct grid dimensions in style", () => {
    const buffer = createBuffer(5, 3);
    const { container } = render(
      <Canvas buffer={buffer} cellWidth={10} cellHeight={20} />
    );
    const grid = container.querySelector('[data-testid="canvas-grid"]') as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(5, 10px)");
    expect(grid.style.gridTemplateRows).toBe("repeat(3, 20px)");
  });
});
