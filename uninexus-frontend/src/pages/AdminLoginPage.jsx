import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const AdminLoginPage = () => {
    const { login } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const errs = {};
        if (!form.email) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
        if (!form.password) errs.password = 'Password is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.role !== 'admin') {
                toast.error('Access denied. Admin privileges required.');
                return;
            }
            toast.success('Welcome back, Admin!');
            navigate('/admin/dashboard');
        } catch (err) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left: Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4">
                        Admin Portal
                    </h1>
                    <p className="text-white/80 text-lg max-w-md">
                        Manage your campus community, interests, and user engagement from one powerful dashboard.
                    </p>
                    <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        {['👥 User Management', '🎯 Interest Control', '📊 Analytics', '🛡️ Admin Tools'].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="bg-white/10 backdrop-blur rounded-2xl p-3 text-white text-sm font-medium"
                                >
                                    {item}
                                </div>
                            )
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Right: Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div>
                        <Link to="/" className="text-2xl font-bold">
                            Uni<span className="gradient-text">Nexus</span>
                        </Link>
                        <div className="flex items-center gap-2 mt-6">
                            <ShieldCheck size={24} className="text-accent-purple" />
                            <h2 className="text-3xl font-extrabold text-text-primary dark:text-text-dark">
                                Admin Sign In
                            </h2>
                        </div>
                        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
                            Don&apos;t have an admin account?{' '}
                            <Link
                                to="/admin/signup"
                                className="font-semibold text-accent-purple hover:underline"
                            >
                                Register here
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            icon={Mail}
                            placeholder="admin@university.edu"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            error={errors.email}
                        />
                        <Input
                            label="Password"
                            type="password"
                            icon={Lock}
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            error={errors.password}
                        />

                        <Button
                            type="submit"
                            variant="gradient"
                            size="lg"
                            className="w-full"
                            loading={loading}
                        >
                            <LogIn size={18} />
                            Sign In as Admin
                        </Button>
                    </form>

                    <p className="text-center text-sm text-text-secondary dark:text-text-dark-secondary">
                        Not an admin?{' '}
                        <Link to="/login" className="font-semibold text-accent-purple hover:underline">
                            Student login
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
