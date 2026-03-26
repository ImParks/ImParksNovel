import { forwardRef, InputHTMLAttributes } from 'react';

export interface RadioOption {
  id: string;
  label: string;
  value: string;
}

interface RadioGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  options: RadioOption[];
  name: string;
  value?: string;
  onChange?: (value: string) => void;
}

const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  ({ options, name, value, onChange, className = '', ...props }, ref) => {
    return (
      <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 cursor-pointer">
            <input
              ref={ref}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-4 h-4 accent-primary-500 cursor-pointer"
              {...props}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
          </label>
        ))}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export { RadioGroup };
export type { RadioGroupProps };
