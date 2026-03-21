import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const AdminSignupPage = () => {
    const { signup } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.email) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
        if (!form.password) errs.password = 'Password is required';
        else if (form.password.length < 6)
            errs.password = 'Password must be at least 6 characters';
        if (form.password !== form.confirmPassword)
            errs.confirmPassword = 'Passwords do not match';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await signup({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                role: 'admin',
            });
            toast.success('Admin account created successfully!');
            navigate('/admin/dashboard');
        } catch (err) {
            toast.error(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left: Form */}
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
                                Create Admin Account
                            </h2>
                        </div>
                        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
                            Already have an admin account?{' '}
                            <Link
                                to="/admin/login"
                                className="font-semibold text-accent-purple hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Full Name"
                            icon={User}
                            placeholder="Admin Name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            error={errors.name}
                        />
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
                        <Input
                            label="Confirm Password"
                            type="password"
                            icon={Lock}
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={(e) =>
                                setForm({ ...form, confirmPassword: e.target.value })
                            }
                            error={errors.confirmPassword}
                        />

                        <Button
                            type="submit"
                            variant="gradient"
                            size="lg"
                            className="w-full"
                            loading={loading}
                        >
                            <UserPlus size={18} />
                            Create Admin Account
                        </Button>
                    </form>

                    <p className="text-center text-sm text-text-secondary dark:text-text-dark-secondary">
                        Not an admin?{' '}
                        <Link to="/signup" className="font-semibold text-accent-purple hover:underline">
                            Student signup
                        </Link>
                    </p>
                </motion.div>
            </div>

            {/* Right: Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
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
                        Take control of UniNexus — manage users, curate interests, and keep the community thriving.
                    </p>
                    <div className="mt-12 space-y-4 max-w-sm mx-auto">
                        {[
                            { step: '1', label: 'Create your admin account' },
                            { step: '2', label: 'Access the dashboard' },
                            { step: '3', label: 'Start managing!' },
                        ].map(({ step, label }) => (
                            <div
                                key={step}
                                className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-2xl px-4 py-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                                    {step}
                                </div>
                                <span className="text-white font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminSignupPage;
