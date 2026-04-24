import { useState } from 'react';

const sizeMap = {
    xs: 'w-8 h-8 text-sm',
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
};

/**
 * Reusable user avatar component.
 * Shows the profile photo if available, otherwise falls back to
 * a gradient circle with the user's first initial.
 *
 * @param {object} props
 * @param {object} props.user - User object with `name` and optionally `profilePhotoUrl`
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='sm'] - Predefined size
 * @param {string} [props.className] - Additional CSS classes
 */
const UserAvatar = ({ user, size = 'sm', className = '' }) => {
    const [imgError, setImgError] = useState(false);
    const sizeClass = sizeMap[size] || sizeMap.sm;
    const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';
    const photoUrl = user?.profilePhotoUrl;

    if (photoUrl && !imgError) {
        return (
            <img
                src={photoUrl}
                alt={user?.name || 'User'}
                onError={() => setImgError(true)}
                className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} rounded-full gradient-bg flex items-center justify-center text-white font-bold shrink-0 ${className}`}
        >
            {initial}
        </div>
    );
};

export default UserAvatar;
