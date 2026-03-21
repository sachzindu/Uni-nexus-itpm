import { motion } from 'framer-motion';

const Card = ({
    children,
    className = '',
    hover = true,
    padding = true,
    onClick,
    ...props
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className={`
        bg-white dark:bg-surface-dark-alt
        rounded-3xl card-shadow
        ${hover ? 'card-hover' : ''}
        ${padding ? 'p-6' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
