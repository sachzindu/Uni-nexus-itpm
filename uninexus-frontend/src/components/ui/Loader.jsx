const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
};

const Loader = ({ size = 'md', className = '' }) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`
          ${sizes[size]}
          rounded-full
          border-accent-purple
          border-t-transparent
          animate-spin
        `}
            />
        </div>
    );
};

// Skeleton loader for content placeholders
export const Skeleton = ({ className = '', rounded = false }) => {
    return (
        <div
            className={`
        animate-pulse bg-gray-200 dark:bg-gray-700
        ${rounded ? 'rounded-full' : 'rounded-xl'}
        ${className}
      `}
        />
    );
};

export default Loader;
