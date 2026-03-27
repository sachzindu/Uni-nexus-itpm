import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SignupPage = () => {
    const { signup } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        faculty: '',
        studentIdNumber: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.email) errs.email = 'Email is required';
        else if (!/^it\d{8}@sliit\.lk$/i.test(form.email.trim()))
            errs.email = 'Email must be in the format itXXXXXXXX@sliit.lk';
        if (!form.password) errs.password = 'Password is required';
        else if (form.password.length < 6)
            errs.password = 'Password must be at least 6 characters';
        if (form.password !== form.confirmPassword)
            errs.confirmPassword = 'Passwords do not match';
        if (!form.faculty.trim()) errs.faculty = 'Faculty is required';
        if (!form.studentIdNumber) errs.studentIdNumber = 'Student ID Number is required';
        else if (!/^[A-Za-z0-9]{10}$/.test(form.studentIdNumber)) errs.studentIdNumber = 'Student ID Number must be exactly 10 letters and numbers';
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
                faculty: form.faculty.trim(),
                studentIdNumber: form.studentIdNumber.trim(),
            });
            toast.success('Account created! Let\'s set up your profile.');
            navigate('/onboarding');
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
                        <h2 className="mt-6 text-3xl font-extrabold text-text-primary dark:text-text-dark">
                            Create your account
                        </h2>
                        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
                            Already have an account?{' '}
                            <Link
                                to="/login"
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
                            placeholder="John Doe"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            error={errors.name}
                        />
                        <Input
                            label="Email"
                            type="email"
                            icon={Mail}
                            placeholder="you@sliit.lk"
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
                        <Input
                            label="Faculty"
                            placeholder="Faculty of Computing"
                            value={form.faculty}
                            onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                            error={errors.faculty}
                        />
                        <Input
                            label="Student ID Number"
                            placeholder="e.g. IT12345678"
                            value={form.studentIdNumber}
                            onChange={(e) => setForm({ ...form, studentIdNumber: e.target.value })}
                            error={errors.studentIdNumber}
                        />

                        <Button
                            type="submit"
                            variant="gradient"
                            size="lg"
                            className="w-full"
                            loading={loading}
                        >
                            <UserPlus size={18} />
                            Create Account
                        </Button>
                    </form>
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
                    <h1 className="text-5xl font-extrabold text-white mb-4">
                        Join Your Community
                    </h1>
                    <p className="text-white/80 text-lg max-w-md">
                        Connect with thousands of students who share your passions and academic goals.
                    </p>
                    <div className="mt-12 space-y-4 max-w-sm mx-auto">
                        {[
                            { step: '1', label: 'Create your account' },
                            { step: '2', label: 'Select your interests' },
                            { step: '3', label: 'Start connecting!' },
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

export default SignupPage;
