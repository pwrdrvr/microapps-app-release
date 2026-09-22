import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useRef } from 'react';
import { MIN_RULES_HEIGHT, SplitHandle } from './SplitHandle';

function Harness({
  height,
  onResize,
}: {
  height: number | null;
  onResize: (h: number | null) => void;
}) {
  const listRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  return (
    <div>
      <section ref={listRef} />
      <SplitHandle height={height} onResize={onResize} listRef={listRef} panelRef={panelRef} />
      <section ref={panelRef} />
    </div>
  );
}

function handle() {
  return screen.getByRole('separator', { name: 'Resize the rules panel' });
}

// jsdom implements neither PointerEvent nor pointer capture. Without the
// constructor, fireEvent falls back to a bare Event and the handler sees no
// `button` or `clientY` — so the drag tests would pass against a component
// that never reads them. MouseEvent carries both.
class TestPointerEvent extends MouseEvent {
  readonly pointerId: number;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.pointerId = props.pointerId ?? 1;
  }
}

describe('SplitHandle', () => {
  beforeEach(() => {
    window.PointerEvent = TestPointerEvent as unknown as typeof window.PointerEvent;
    globalThis.PointerEvent = TestPointerEvent as unknown as typeof PointerEvent;
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    Element.prototype.hasPointerCapture = vi.fn(() => true);
  });

  afterEach(cleanup);

  test('dragging up makes the rules panel taller', () => {
    const onResize = vi.fn();
    render(<Harness height={200} onResize={onResize} />);

    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientY: 500 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientY: 440 });

    // The handle sits above the panel, so moving up 60px grows it by 60px.
    expect(onResize).toHaveBeenLastCalledWith(260);
  });

  test('dragging down shrinks it, but never below the floor', () => {
    const onResize = vi.fn();
    render(<Harness height={200} onResize={onResize} />);

    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientY: 500 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientY: 9000 });

    expect(onResize).toHaveBeenLastCalledWith(MIN_RULES_HEIGHT);
  });

  test('ignores a drag that never started', () => {
    const onResize = vi.fn();
    render(<Harness height={200} onResize={onResize} />);

    fireEvent.pointerMove(handle(), { pointerId: 1, clientY: 100 });

    expect(onResize).not.toHaveBeenCalled();
  });

  test('resizes from the keyboard, in bigger steps with shift', () => {
    const onResize = vi.fn();
    render(<Harness height={200} onResize={onResize} />);

    fireEvent.keyDown(handle(), { key: 'ArrowUp' });
    expect(onResize).toHaveBeenLastCalledWith(224);

    fireEvent.keyDown(handle(), { key: 'ArrowDown' });
    expect(onResize).toHaveBeenLastCalledWith(176);

    fireEvent.keyDown(handle(), { key: 'ArrowUp', shiftKey: true });
    expect(onResize).toHaveBeenLastCalledWith(272);
  });

  test('Home collapses and Enter restores the automatic height', () => {
    const onResize = vi.fn();
    render(<Harness height={300} onResize={onResize} />);

    fireEvent.keyDown(handle(), { key: 'Home' });
    expect(onResize).toHaveBeenLastCalledWith(MIN_RULES_HEIGHT);

    fireEvent.keyDown(handle(), { key: 'Enter' });
    expect(onResize).toHaveBeenLastCalledWith(null);
  });

  test('double-click resets to the automatic height', () => {
    const onResize = vi.fn();
    render(<Harness height={300} onResize={onResize} />);

    fireEvent.doubleClick(handle());

    expect(onResize).toHaveBeenLastCalledWith(null);
  });

  test('reports the size to assistive tech only once it is set', () => {
    const { rerender } = render(<Harness height={null} onResize={vi.fn()} />);
    expect(handle().getAttribute('aria-valuenow')).toBeNull();

    rerender(<Harness height={240} onResize={vi.fn()} />);
    expect(handle().getAttribute('aria-valuenow')).toBe('240');
  });
});
