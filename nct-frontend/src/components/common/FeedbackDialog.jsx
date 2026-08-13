import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react';
import { normalizeFeedbackText } from '@utils/common';
import { resolveFeedbackDialogSize } from './feedbackDialogConfig';
import { useFeedbackExit } from './feedbackMotion';

const ICONS = {
  success: CircleCheck,
  warning: CircleAlert,
  error: CircleX,
  info: Info,
};

const CONFIRM_BUTTON_CLASSES = {
  primary: 'btn-primary',
  danger: 'btn-danger',
  dark: 'btn-dark',
};

/**
 * 담당자 7: 확인 알림과 선택 확인창을 5번 시안의 한 디자인으로 보여 주는 공통 모달입니다.
 * 내용에 따라 자동으로 소·중·대 크기를 고르며 size="sm|md|lg"로 명시할 수도 있습니다.
 */
export default function FeedbackDialog({
  open,
  title,
  description,
  variant = 'info',
  size = 'auto',
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  showCancelButton = false,
  confirmTone = 'primary',
}) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmButtonRef = useRef(null);
  const { beginExit, handleExitAnimationEnd, isExiting } = useFeedbackExit();
  const normalizedTitle = normalizeFeedbackText(title);
  const normalizedDescription = normalizeFeedbackText(description);
  const resolvedSize = resolveFeedbackDialogSize({
    size,
    title: normalizedTitle,
    description: normalizedDescription,
    hasCancelButton: showCancelButton,
  });
  const Icon = ICONS[variant] ?? ICONS.info;
  const confirmButtonClass = CONFIRM_BUTTON_CLASSES[confirmTone]
    ?? CONFIRM_BUTTON_CLASSES.primary;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const focusFrame = window.requestAnimationFrame(() => confirmButtonRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      beginExit(onCancel ?? onConfirm);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [beginExit, open, onCancel, onConfirm]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`feedback-dialog__overlay${isExiting ? ' feedback-dialog__overlay--leaving' : ''}`}
      onAnimationEnd={handleExitAnimationEnd}
    >
      <section
        aria-describedby={normalizedDescription ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`feedback-dialog feedback-dialog--${resolvedSize} feedback-dialog--${variant}${isExiting ? ' feedback-dialog--leaving' : ''}`}
        role="alertdialog"
      >
        <div className="feedback-dialog__icon" aria-hidden="true">
          <Icon />
        </div>
        <h2 className="feedback-dialog__title" id={titleId}>{normalizedTitle}</h2>
        {normalizedDescription ? (
          <p className="feedback-dialog__description" id={descriptionId}>{normalizedDescription}</p>
        ) : null}
        <div className="feedback-dialog__actions">
          {showCancelButton ? (
            <button
              className="btn btn-ghost feedback-dialog__button"
              disabled={isExiting}
              onClick={() => beginExit(onCancel)}
              type="button"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            className={`btn ${confirmButtonClass} feedback-dialog__button`}
            disabled={isExiting}
            onClick={() => beginExit(onConfirm)}
            ref={confirmButtonRef}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
