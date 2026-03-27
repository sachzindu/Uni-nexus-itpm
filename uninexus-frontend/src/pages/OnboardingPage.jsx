import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap,
    Sparkles,
    Target,
    ArrowRight,
    ArrowLeft,
    Check,
    BookOpen,
    Users,
    Coffee,
    Lightbulb,
    Camera,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { interestAPI, userAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const steps = [
    { label: 'Basic Info', icon: GraduationCap },
    { label: 'Interests', icon: Sparkles },
    { label: 'Goals', icon: Target },
];

const departments = [
    'Computing',
    'Engineering',
    'Business',
    'Humanities and sciences',
    'Medicine',
    'William anjilies Institute',
    'Architecture',
];

const socialGoals = [
    { id: 'study', label: 'Study Partners', icon: BookOpen, desc: 'Find peers to study and collaborate with' },
    { id: 'social', label: 'Casual Socializing', icon: Coffee, desc: 'Meet new people and hang out' },
    { id: 'skillup', label: 'Skill Development', icon: Lightbulb, desc: 'Learn new skills together' },
    { id: 'network', label: 'Professional Network', icon: Users, desc: 'Build career connections' },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const OnboardingPage = () => {
    const { updateProfile, fetchMe } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        department: '',
        year: '',
        bio: '',
        selectedInterests: [],
        goals: [],
    });

    // Clean up object URL on unmount or when preview changes
    useEffect(() => {
        return () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
        };
    }, [photoPreview]);

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Only JPEG, PNG, and WebP images are allowed.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Image must be smaller than 5 MB.');
            return;
        }

        // Revoke old preview
        if (photoPreview) URL.revokeObjectURL(photoPreview);

        setProfilePhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    // Fetch interest categories
    useEffect(() => {
        const fetchInterests = async () => {
            try {
                const res = await interestAPI.getAll();
                // Backend returns { success, data: { interests: [...] } }
                // Axios interceptor strips outer response.data, so res = { success, data: { interests } }
                const interests = res?.data?.interests || res?.data || [];
                setCategories(Array.isArray(interests) ? interests : []);
            } catch {
                // Use dummy data if API fails
                setCategories([
                    { _id: '1', category: 'Technology & Computers', subInterests: ['Web Development', 'Mobile Development', 'Gaming', 'AI & Machine Learning', 'Cybersecurity'] },
                    { _id: '2', category: 'Arts & Creativity', subInterests: ['Photography', 'Graphic Design', 'Music Production', 'Film Making', 'Creative Writing'] },
                    { _id: '3', category: 'Sports & Fitness', subInterests: ['Football', 'Basketball', 'Gym & Weightlifting', 'Yoga', 'Swimming'] },
                    { _id: '4', category: 'Academic & Research', subInterests: ['Research Methods', 'Scientific Writing', 'Data Analysis', 'Lab Work', 'Tutoring'] },
                    { _id: '5', category: 'Business & Entrepreneurship', subInterests: ['Startups', 'Marketing', 'Finance', 'Leadership', 'E-Commerce'] },
                    { _id: '6', category: 'Social & Community', subInterests: ['Volunteering', 'Event Planning', 'Public Speaking', 'Debate', 'Community Service'] },
                ]);
            }
        };
        fetchInterests();
    }, []);

    const toggleInterest = (catId, subInterest) => {
        setForm((prev) => {
            const existing = prev.selectedInterests.find((si) => si.category === catId);
            if (existing) {
                const has = existing.subInterests.includes(subInterest);
                if (has) {
                    const updated = existing.subInterests.filter((s) => s !== subInterest);
                    if (updated.length === 0) {
                        return {
                            ...prev,
                            selectedInterests: prev.selectedInterests.filter(
                                (si) => si.category !== catId
                            ),
                        };
                    }
                    return {
                        ...prev,
                        selectedInterests: prev.selectedInterests.map((si) =>
                            si.category === catId ? { ...si, subInterests: updated } : si
                        ),
                    };
                }
                return {
                    ...prev,
                    selectedInterests: prev.selectedInterests.map((si) =>
                        si.category === catId
                            ? { ...si, subInterests: [...si.subInterests, subInterest] }
                            : si
                    ),
                };
            }
            return {
                ...prev,
                selectedInterests: [
                    ...prev.selectedInterests,
                    { category: catId, subInterests: [subInterest] },
                ],
            };
        });
    };

    const isSubSelected = (catId, sub) => {
        const cat = form.selectedInterests.find((si) => si.category === catId);
        return cat?.subInterests.includes(sub) || false;
    };

    const toggleGoal = (goalId) => {
        setForm((prev) => ({
            ...prev,
            goals: prev.goals.includes(goalId)
                ? prev.goals.filter((g) => g !== goalId)
                : [...prev.goals, goalId],
        }));
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            // Upload profile photo first (optional)
            if (profilePhoto) {
                try {
                    await userAPI.uploadProfilePhoto(profilePhoto);
                } catch (photoErr) {
                    toast.error(photoErr.message || 'Failed to upload photo, but continuing setup.');
                }
            }

            await updateProfile({
                department: form.department,
                year: parseInt(form.year, 10),
                bio: form.bio,
                selectedInterests: form.selectedInterests,
            });

            // Refresh user data so profilePhotoUrl is available globally
            await fetchMe();

            toast.success('Profile set up successfully!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        if (currentStep === 0) return form.department && form.year;
        if (currentStep === 1) return form.selectedInterests.length > 0;
        if (currentStep === 2) return form.goals.length > 0;
        return true;
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-surface-alt dark:bg-surface-dark">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                {/* Step indicator */}
                <div className="flex items-center justify-center mb-8 gap-0">
                    {steps.map(({ label, icon: Icon }, i) => (
                        <div key={label} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center
                    transition-colors duration-300 ${i <= currentStep
                                            ? 'gradient-bg text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-text-secondary'
                                        }`}
                                >
                                    {i < currentStep ? <Check size={18} /> : <Icon size={18} />}
                                </div>
                                <span
                                    className={`text-xs mt-1.5 font-medium ${i <= currentStep
                                        ? 'text-accent-purple'
                                        : 'text-text-secondary dark:text-text-dark-secondary'
                                        }`}
                                >
                                    {label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 ${i < currentStep
                                        ? 'gradient-bg'
                                        : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-surface-dark-alt rounded-3xl card-shadow p-8">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Basic Info */}
                        {currentStep === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark">
                                        Tell us about yourself
                                    </h2>
                                    <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
                                        Help us match you with the right people.
                                    </p>
                                </div>

                                {/* Profile Photo Upload */}
                                <div className="flex justify-center">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoSelect}
                                        className="hidden"
                                        id="profile-photo-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative w-28 h-28 rounded-full border-2 border-dashed
                                            border-border dark:border-border-dark
                                            hover:border-accent-purple dark:hover:border-accent-purple
                                            transition-all cursor-pointer overflow-hidden group"
                                        id="profile-photo-upload-btn"
                                    >
                                        {photoPreview ? (
                                            <>
                                                <img
                                                    src={photoPreview}
                                                    alt="Profile preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                                                    transition-opacity flex items-center justify-center">
                                                    <Camera size={24} className="text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center
                                                text-text-secondary dark:text-text-dark-secondary
                                                group-hover:text-accent-purple transition-colors">
                                                <Camera size={28} className="mb-1" />
                                                <span className="text-[10px] font-medium">Add Photo</span>
                                            </div>
                                        )}
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-text-dark mb-1.5">
                                        Faculty
                                    </label>
                                    <select
                                        value={form.department}
                                        onChange={(e) =>
                                            setForm({ ...form, department: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark
                      border border-border dark:border-border-dark rounded-xl
                      text-text-primary dark:text-text-dark
                      focus:outline-none focus:ring-2 focus:ring-accent-purple/50
                      cursor-pointer"
                                    >
                                        <option value="">Select department</option>
                                        {departments.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary dark:text-text-dark mb-1.5">
                                        Year of Study
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[1, 2, 3, 4].map((y) => (
                                            <button
                                                key={y}
                                                type="button"
                                                onClick={() =>
                                                    setForm({ ...form, year: y.toString() })
                                                }
                                                className={`py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${form.year === y.toString()
                                                    ? 'gradient-bg text-white'
                                                    : 'bg-surface-alt dark:bg-surface-dark border border-border dark:border-border-dark text-text-primary dark:text-text-dark hover:border-accent-purple'
                                                    }`}
                                            >
                                                Year {y}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Input
                                    label="Bio (optional)"
                                    placeholder="Tell people a bit about yourself..."
                                    value={form.bio}
                                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                />
                            </motion.div>
                        )}

                        {/* Step 2: Interests */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark">
                                        Pick your interests
                                    </h2>
                                    <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
                                        Select topics you&apos;re passionate about.
                                    </p>
                                </div>

                                <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
                                    {categories.map((cat) => (
                                        <div key={cat._id}>
                                            <h3 className="text-sm font-semibold text-text-primary dark:text-text-dark mb-2">
                                                {cat.category}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {cat.subInterests.map((sub) => (
                                                    <button
                                                        key={sub}
                                                        type="button"
                                                        onClick={() => toggleInterest(cat._id, sub)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold
                              border transition-all cursor-pointer ${isSubSelected(cat._id, sub)
                                                                ? 'gradient-bg text-white border-transparent'
                                                                : 'bg-white dark:bg-surface-dark border-border dark:border-border-dark text-text-primary dark:text-text-dark hover:border-accent-purple'
                                                            }`}
                                                    >
                                                        {sub}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Goals */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark">
                                        What&apos;s your goal?
                                    </h2>
                                    <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
                                        Let us know why you&apos;re here so we can help you connect.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {socialGoals.map(({ id, label, icon: Icon, desc }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => toggleGoal(id)}
                                            className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${form.goals.includes(id)
                                                ? 'border-accent-purple bg-accent-purple/5 dark:bg-accent-purple/10'
                                                : 'border-border dark:border-border-dark hover:border-accent-purple/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <div
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.goals.includes(id)
                                                        ? 'gradient-bg text-white'
                                                        : 'bg-surface-alt dark:bg-surface-dark text-text-secondary'
                                                        }`}
                                                >
                                                    <Icon size={16} />
                                                </div>
                                                <span className="font-semibold text-sm text-text-primary dark:text-text-dark">
                                                    {label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary ml-11">
                                                {desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border dark:border-border-dark">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep((s) => s - 1)}
                            disabled={currentStep === 0}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>

                        {currentStep < steps.length - 1 ? (
                            <Button
                                variant="gradient"
                                onClick={() => setCurrentStep((s) => s + 1)}
                                disabled={!canProceed()}
                            >
                                Next
                                <ArrowRight size={16} />
                            </Button>
                        ) : (
                            <Button
                                variant="gradient"
                                onClick={handleFinish}
                                loading={loading}
                                disabled={!canProceed()}
                            >
                                Complete Setup
                                <Check size={16} />
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingPage;
