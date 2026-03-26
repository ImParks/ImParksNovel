import { TextareaHTMLAttributes, forwardRef, useId } from 'react';

// Usage:
// <Textarea label="댓글" placeholder="의견을 입력해주세요" />
// <Textarea label="설명" error="입력이 필요합니다" />

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id: propId, ...props }, ref) => {
    const generatedId = useId();
    const id = propId ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          aria-invalid={hasError}
          aria-describedby={
            [error ? errorId : '', hint ? hintId : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={[
            'w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-150',
            'bg-white dark:bg-gray-900',
            'text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'resize-vertical min-h-24',
            hasError
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
              : 'border-gray-300 dark:border-gray-700 focus:ring-primary-500 focus:border-primary-500',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-red-500 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };
