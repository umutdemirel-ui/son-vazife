import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Native modality also keeps keyboard focus out of the menu behind the sheet. */
export function MenuDialog({
  title,
  kicker,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  kicker: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    const trigger = document.activeElement as HTMLElement | null;
    el?.showModal();
    return () => {
      el?.close();
      trigger?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`menu-dialog ${wide ? 'menu-dialog-wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <header className="dialog-heading">
        <div>
          <p className="kicker">
            <i />
            {kicker}
          </p>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button
          type="button"
          className="square-button"
          aria-label="Kapat"
          onClick={onClose}
          autoFocus
        >
          <X size={18} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
