const Badge = ({
    children,
    variant = 'default',
    className = '',
    removable = false,
    onRemove,
}) => {
    const variants = {
        default:
            'bg-surface-alt text-text-primary dark:bg-surface-dark dark:text-text-dark border border-border dark:border-border-dark',
        gradient: 'gradient-bg text-white',
        purple: 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20',
        orange: 'bg-accent-orange/10 text-amber-700 dark:text-accent-orange border border-accent-orange/20',
        success: 'bg-success/10 text-success border border-success/20',
        error: 'bg-error/10 text-error border border-error/20',
    };

    return (
        <span
            className={`
        inline-flex items-center gap-1.5
        px-3 py-1 rounded-full
        text-xs font-semibold
        ${variants[variant]}
        ${className}
      `}
        >
            {children}
            {removable && (
                <button
                    onClick={onRemove}
                    className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
                >
                    ×
                </button>
            )}
        </span>
    );
};

export default Badge;
