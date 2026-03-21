import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const icons = {
    success: <CheckCircle className="text-success" size={20} />,
    error: <XCircle className="text-error" size={20} />,
    warning: <AlertCircle className="text-warning" size={20} />,
    info: <AlertCircle className="text-accent-purple" size={20} />,
};

const Toast = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [toast, onRemove]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="flex items-center gap-3 min-w-[300px] max-w-md
        px-4 py-3 rounded-2xl card-shadow
        bg-white dark:bg-surface-dark-alt
        border border-border dark:border-border-dark"
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm text-text-primary dark:text-text-dark">
                {toast.message}
            </p>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-text-secondary hover:text-text-primary dark:text-text-dark-secondary
          dark:hover:text-text-dark cursor-pointer"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <Toast key={t.id} toast={t} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
