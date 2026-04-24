import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, BookOpen, GraduationCap, ShieldPlus, Send } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const AdminRequestPage = () => {
    const toast = useToast();
    const [form, setForm] = useState({
        name: '',
        faculty: '',
        yearOfStudy: '',
        email: '',
        contactNumber: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};

        if (!form.name.trim()) newErrors.name = 'Name is required';
        if (!form.faculty) newErrors.faculty = 'Faculty is required';
        if (!form.yearOfStudy) newErrors.yearOfStudy = 'Year of study is required';

        // SLIIT email validation: itXXXXXXXX@sliit.lk (case insensitive)
        const emailRegex = /^it\d{8}@sliit\.lk$/i;
        if (!form.email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(form.email)) {
            newErrors.email = 'Invalid SLIIT email format (e.g., it12345678@sliit.lk)';
        }

        // Contact number validation: Exactly 10 digits
        const phoneRegex = /^\d{10}$/;
        if (!form.contactNumber) {
            newErrors.contactNumber = 'Contact number is required';
        } else if (!phoneRegex.test(form.contactNumber)) {
            newErrors.contactNumber = 'Contact number must be exactly 10 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        // Simulate an API call
        setTimeout(() => {
            setLoading(false);
            toast.success('Successfully submitted!');
            setForm({
                name: '',
                faculty: '',
                yearOfStudy: '',
                email: '',
                contactNumber: ''
            });
            setErrors({});
        }, 1500);
    };

    const selectClasses = `
        w-full px-4 py-2.5 pl-10
        bg-white dark:bg-surface-dark
        border border-border dark:border-border-dark
        rounded-xl
        text-text-primary dark:text-text-dark
        focus:outline-none focus:ring-2 focus:ring-accent-purple/50
        focus:border-accent-purple
        transition-all duration-200
    `;

    return (
        <div className="min-h-screen flex">
            {/* Left side: Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShieldPlus size={40} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4">
                        Admin Registration
                    </h1>
                    <p className="text-white/80 text-lg max-w-md mx-auto">
                        Request administrative access to manage events, moderate content, and lead your campus community.
                    </p>
                </motion.div>
            </div>

            {/* Right side: Form */}
            <div className="flex-1 flex flex-col justify-center p-8 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md mx-auto space-y-8 py-8"
                >
                    <div>
                        <Link to="/" className="text-2xl font-bold">
                            Uni<span className="gradient-text">Nexus</span>
                        </Link>
                        <div className="flex items-center gap-2 mt-6">
                            <ShieldPlus size={24} className="text-accent-purple" />
                            <h2 className="text-3xl font-extrabold text-text-primary dark:text-text-dark">
                                Request Admin Access
                            </h2>
                        </div>
                        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
                            Already have an admin account?{' '}
                            <Link
                                to="/admin/login"
                                className="font-semibold text-accent-purple hover:underline"
                            >
                                Sign in here
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

                        {/* Faculty Select */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                                Faculty
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-dark-secondary pointer-events-none">
                                    <BookOpen size={18} />
                                </div>
                                <select
                                    className={`${selectClasses} ${errors.faculty ? 'border-error focus:ring-error/50' : ''} ${!form.faculty ? 'text-text-secondary dark:text-text-dark-secondary' : ''}`}
                                    value={form.faculty}
                                    onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                                >
                                    <option value="" disabled>Select your faculty</option>
                                    <option value="Computing">Faculty of Computing</option>
                                    <option value="Engineering">Faculty of Engineering</option>
                                    <option value="Business">Faculty of Business</option>
                                    <option value="Humanities & Sciences">Faculty of Humanities & Sciences</option>
                                </select>
                            </div>
                            {errors.faculty && <p className="text-sm text-error mt-1">{errors.faculty}</p>}
                        </div>

                        {/* Year of Study Select */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                                Year of Study
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-dark-secondary pointer-events-none">
                                    <GraduationCap size={18} />
                                </div>
                                <select
                                    className={`${selectClasses} ${errors.yearOfStudy ? 'border-error focus:ring-error/50' : ''} ${!form.yearOfStudy ? 'text-text-secondary dark:text-text-dark-secondary' : ''}`}
                                    value={form.yearOfStudy}
                                    onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })}
                                >
                                    <option value="" disabled>Select year of study</option>
                                    <option value="1">Year 1</option>
                                    <option value="2">Year 2</option>
                                    <option value="3">Year 3</option>
                                    <option value="4">Year 4</option>
                                </select>
                            </div>
                            {errors.yearOfStudy && <p className="text-sm text-error mt-1">{errors.yearOfStudy}</p>}
                        </div>

                        <Input
                            label="SLIIT Email Address"
                            type="email"
                            icon={Mail}
                            placeholder="it12345678@sliit.lk"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            error={errors.email}
                        />

                        <Input
                            label="Contact Number"
                            type="tel"
                            icon={Phone}
                            placeholder="0712345678"
                            value={form.contactNumber}
                            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                            error={errors.contactNumber}
                        />

                        <Button
                            type="submit"
                            variant="gradient"
                            size="lg"
                            className="w-full"
                            loading={loading}
                        >
                            <Send size={18} />
                            Submit Request
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminRequestPage;
