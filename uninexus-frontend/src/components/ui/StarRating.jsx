import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const StarRating = ({
    rating = 0,
    maxStars = 5,
    onChange,
    readonly = false,
    size = 24,
}) => {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="inline-flex gap-1">
            {Array.from({ length: maxStars }, (_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= (hovered || rating);

                return (
                    <motion.button
                        key={i}
                        type="button"
                        whileHover={readonly ? {} : { scale: 1.2 }}
                        whileTap={readonly ? {} : { scale: 0.9 }}
                        onClick={() => !readonly && onChange?.(starValue)}
                        onMouseEnter={() => !readonly && setHovered(starValue)}
                        onMouseLeave={() => !readonly && setHovered(0)}
                        className={`${readonly ? '' : 'cursor-pointer'} transition-colors`}
                        disabled={readonly}
                    >
                        <Star
                            size={size}
                            className={
                                isFilled
                                    ? 'fill-accent-orange text-accent-orange'
                                    : 'text-gray-300 dark:text-gray-600'
                            }
                        />
                    </motion.button>
                );
            })}
        </div>
    );
};

export default StarRating;
