import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="border-t border-border dark:border-border-dark bg-white dark:bg-surface-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-primary dark:text-white">
                            Uni<span className="gradient-text">Nexus</span>
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary flex items-center gap-1">
                        Made with <Heart size={14} className="text-error fill-error" /> for SLIIT students
                    </p>
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                        © {new Date().getFullYear()} UniNexus. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
