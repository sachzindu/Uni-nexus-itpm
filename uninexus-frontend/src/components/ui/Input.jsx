import { forwardRef } from 'react';

const Input = forwardRef(
    (
        {
            label,
            error,
            icon: Icon,
            className = '',
            type = 'text',
            ...props
        },
        ref
    ) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {Icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-dark-secondary">
                            <Icon size={18} />
                        </div>
                    )}
                    <input
                        ref={ref}
                        type={type}
                        className={`
              w-full px-4 py-2.5
              ${Icon ? 'pl-10' : ''}
              bg-white dark:bg-surface-dark
              border border-border dark:border-border-dark
              rounded-xl
              text-text-primary dark:text-text-dark
              placeholder-text-secondary dark:placeholder-text-dark-secondary
              focus:outline-none focus:ring-2 focus:ring-accent-purple/50
              focus:border-accent-purple
              transition-all duration-200
              ${error ? 'border-error focus:ring-error/50' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-sm text-error mt-1">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
