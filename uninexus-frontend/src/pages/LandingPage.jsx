import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Users,
    Zap,
    Calendar,
    MessageCircle,
    Monitor,
    Dumbbell,
    Music,
    Gamepad2,
    ChevronDown,
    ArrowRight,
    Star,
    BookOpen,
    Globe,
    Shield,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

// Animation variants
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
};

const stagger = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

// Interest Web icons
const interestIcons = [
    { icon: Monitor, label: 'Tech', angle: 0, color: '#6366F1' },
    { icon: Dumbbell, label: 'Fitness', angle: 90, color: '#10B981' },
    { icon: Music, label: 'Music', angle: 180, color: '#F59E0B' },
    { icon: Gamepad2, label: 'Gaming', angle: 270, color: '#EF4444' },
    { icon: BookOpen, label: 'Study', angle: 45, color: '#8B5CF6' },
    { icon: Globe, label: 'Social', angle: 135, color: '#06B6D4' },
];

const stats = [
    { value: '100+', label: 'Active Users', icon: Users },
    { value: '25+', label: 'Projects', icon: Zap },
    { value: '50+', label: 'Club Sessions', icon: Calendar },
    { value: '100+', label: 'Events', icon: Star },
];

const features = [
    {
        icon: Users,
        title: 'Smart Matching',
        description:
            'Our AI-powered engine suggests friends based on shared interests and academic goals.',
    },
    {
        icon: MessageCircle,
        title: 'Real-Time Chat',
        description:
            'Connect instantly with friends and groups through our seamless messaging system.',
    },
    {
        icon: Calendar,
        title: 'Events & Workshops',
        description:
            'Discover, create, and manage campus events with built-in registration and feedback.',
    },
    {
        icon: Shield,
        title: 'Interest Groups',
        description:
            'Join or create purpose-driven groups around shared passions and academic interests.',
    },
];

const faqs = [
    {
        q: 'How does interest matching work?',
        a: 'UniNexus uses a Jaccard Similarity algorithm to compare your selected interests with other students, giving you the most relevant recommendations.',
    },
    {
        q: 'Can I create private groups?',
        a: 'Yes! When creating a group, you can set it as private. Members must be invited or approved by an admin to join.',
    },
    {
        q: 'Is messaging real-time?',
        a: 'Absolutely. Our chat system is powered by WebSocket technology, providing instant message delivery with typing indicators and online status.',
    },
    {
        q: 'How do events work?',
        a: 'Group admins can create events with capacity limits. Students register and receive unique confirmation IDs. After events, attendees can leave ratings and reviews.',
    },
    {
        q: 'Is my data secure?',
        a: 'Yes. We use JWT authentication, encrypted passwords, role-based access control, and follow security best practices throughout the platform.',
    },
];

const testimonials = [
    {
        name: 'Sarah Chen',
        role: 'Computer Science, Year 3',
        text: 'UniNexus helped me find study partners with similar interests. The matching algorithm is surprisingly accurate!',
        rating: 5,
    },
    {
        name: 'Marcus Johnson',
        role: 'Engineering, Year 2',
        text: 'The event management feature made organizing our robotics workshop so much easier. Love the registration system!',
        rating: 5,
    },
    {
        name: 'Aisha Patel',
        role: 'Business, Year 1',
        text: 'As a freshman, UniNexus was a lifesaver for connecting with upperclassmen who share my career interests.',
        rating: 4,
    },
];

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center pt-16">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 -left-40 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 -right-40 w-96 h-96 bg-accent-orange/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Text */}
                        <motion.div {...fadeInUp} className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5
                  bg-accent-purple/10 text-accent-purple rounded-full text-sm font-medium"
                            >
                                <Zap size={16} />
                                University Social Platform
                            </motion.div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                                Connect Your{' '}
                                <span className="gradient-text">Campus</span>
                            </h1>

                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-lg">
                                Your Network is Your Net Worth. Discover friends, join groups,
                                attend events, and build lasting connections at your university.
                            </p>

                            <div className="flex flex-wrap gap-5 pt-4">
                                <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
                                    <Button variant="gradient" size="lg">
                                        {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                                        <ArrowRight size={18} />
                                    </Button>
                                </Link>
                                <Link to={isAuthenticated ? '/discover' : '/signup'}>
                                    <Button variant="secondary" size="lg">
                                        Explore Interests
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Right: Interest Web */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="relative flex items-center justify-center"
                        >
                            <div className="relative w-80 h-80 md:w-96 md:h-96 overflow-visible">
                                {/* Center circle */}
                                <div className="absolute inset-1/4 gradient-bg rounded-full flex items-center justify-center animate-pulse-glow z-10">
                                    <span className="text-white font-bold text-lg">You</span>
                                </div>

                                {/* Orbiting icons — use left/top instead of transform to avoid Framer Motion override */}
                                {interestIcons.map(({ icon: Icon, label, angle, color }, i) => {
                                    const radius = 140;
                                    const rad = (angle * Math.PI) / 180;
                                    const x = Math.cos(rad) * radius;
                                    const y = Math.sin(rad) * radius;

                                    return (
                                        <motion.div
                                            key={label}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.8 + i * 0.15, type: 'spring' }}
                                            className="absolute"
                                            style={{
                                                left: `calc(50% + ${x}px - 28px)`,
                                                top: `calc(50% + ${y}px - 28px)`,
                                            }}
                                        >
                                            <motion.div
                                                animate={{ y: [0, -8, 0] }}
                                                transition={{
                                                    duration: 2 + i * 0.3,
                                                    repeat: Infinity,
                                                    ease: 'easeInOut',
                                                }}
                                                className="flex flex-col items-center gap-1"
                                            >
                                                <div
                                                    className="w-14 h-14 rounded-2xl flex items-center justify-center card-shadow bg-white dark:bg-surface-dark-alt"
                                                    style={{ border: `2px solid ${color}20` }}
                                                >
                                                    <Icon size={24} style={{ color }} />
                                                </div>
                                                <span className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary">
                                                    {label}
                                                </span>
                                            </motion.div>
                                        </motion.div>
                                    );
                                })}

                                {/* Connecting lines */}
                                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                                    {interestIcons.map(({ angle }, i) => {
                                        const radius = 140;
                                        const rad = (angle * Math.PI) / 180;
                                        const cx = 50;
                                        const cy = 50;
                                        const x2 = cx + (Math.cos(rad) * radius * 100) / 384;
                                        const y2 = cy + (Math.sin(rad) * radius * 100) / 384;

                                        return (
                                            <line
                                                key={i}
                                                x1={`${cx}%`}
                                                y1={`${cy}%`}
                                                x2={`${x2}%`}
                                                y2={`${y2}%`}
                                                stroke="url(#gradient)"
                                                strokeWidth="1"
                                                strokeDasharray="4 4"
                                                opacity="0.3"
                                            />
                                        );
                                    })}
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#9D6FA3" />
                                            <stop offset="100%" stopColor="#F59E0B" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section — extra spacing for breathing room */}
            <section className="py-28 bg-surface-alt dark:bg-surface-dark-alt">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        variants={stagger}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8"
                    >
                        {stats.map(({ value, label, icon: Icon }) => (
                            <motion.div
                                key={label}
                                variants={fadeInUp}
                                className="text-center p-6 bg-white dark:bg-surface-dark
                  rounded-3xl card-shadow card-hover text-slate-900 dark:text-white"
                            >
                                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl gradient-bg
                  flex items-center justify-center">
                                    <Icon size={24} className="text-white" />
                                </div>
                                <p className="text-3xl md:text-4xl font-extrabold gradient-text">
                                    {value}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {label}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Everything You Need to{' '}
                            <span className="gradient-text">Thrive</span>
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            A comprehensive suite of features designed to enrich your university experience.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map(({ icon: Icon, title, description }, i) => (
                            <Card key={title} className="text-center">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl gradient-bg
                  flex items-center justify-center">
                                    <Icon size={28} className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                    {title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {description}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-28 bg-surface-alt dark:bg-surface-dark-alt">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            What Students <span className="gradient-text">Say</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map(({ name, role, text, rating }) => (
                            <Card key={name}>
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: rating }, (_, i) => (
                                        <Star
                                            key={i}
                                            size={16}
                                            className="fill-accent-orange text-accent-orange"
                                        />
                                    ))}
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 mb-4 italic">
                                    &ldquo;{text}&rdquo;
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
                                        {name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {role}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-28">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Frequently Asked <span className="gradient-text">Questions</span>
                        </h2>
                    </motion.div>

                    <div className="space-y-4">
                        {faqs.map(({ q, a }, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-surface-dark-alt rounded-2xl card-shadow overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-6 py-4
                     text-left text-slate-900 dark:text-white
                     font-medium cursor-pointer"
                                >
                                    {q}
                                    <ChevronDown
                                        size={18}
                                        className={`text-text-secondary transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                <AnimatePresenceFaq isOpen={openFaq === i}>
                                    <div className="px-6 pb-4 text-sm text-slate-600 dark:text-slate-300">
                                        {a}
                                    </div>
                                </AnimatePresenceFaq>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-28 bg-surface-alt dark:bg-surface-dark-alt">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-slate-900 dark:text-white">
                            Ready to Join <span className="gradient-text">UniNexus</span>?
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto">
                            Start building meaningful connections with students who share your passions.
                        </p>
                        <Link to="/signup">
                            <Button variant="gradient" size="lg">
                                Create Your Account <ArrowRight size={18} />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

// Simple FAQ accordion wrapper without AnimatePresence import conflict
const AnimatePresenceFaq = ({ isOpen, children }) => {
    if (!isOpen) return null;
    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.div>
    );
};

export default LandingPage;
