import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { groupAPI, postAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loader from '../components/ui/Loader';

const CreatePostPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);

    const [content, setContent] = useState('');
    const [image, setImage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const grpRes = await groupAPI.getById(id);
                setGroup(grpRes.data?.group || grpRes.data);
            } catch (err) {
                toast.error('Failed to load group');
                navigate('/groups');
            } finally {
                setLoading(false);
            }
        };
        fetchGroup();
    }, [id, navigate, toast]);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setSubmitting(true);
        try {
            await postAPI.create(id, {
                content: content.trim(),
                image: image.trim() || undefined
            });
            toast.success('Post created successfully!');
            navigate(`/groups/${id}`); // Redirect back to group detail
        } catch (err) {
            toast.error(err.message || 'Failed to create post');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (!group) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <button
                onClick={() => navigate(`/groups/${id}`)}
                className="flex items-center gap-2 text-text-secondary dark:text-text-dark-secondary
          hover:text-text-primary dark:hover:text-text-dark mb-6 cursor-pointer"
            >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back to {group.name}</span>
            </button>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-extrabold text-text-primary dark:text-text-dark">
                    Create a <span className="gradient-text">Post</span>
                </h1>
                <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
                    Share your thoughts, questions, or updates with the group.
                </p>
            </motion.div>

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="!p-6 md:!p-8">
                    <form onSubmit={handleCreatePost} className="space-y-6">
                        {/* Content */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                                Post Content <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                placeholder="What's on your mind?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={6}
                                maxLength={5000}
                                className="w-full px-4 py-3 bg-surface-alt dark:bg-surface-dark 
                                    border border-border dark:border-border-dark rounded-xl 
                                    text-text-primary dark:text-text-dark 
                                    focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-y"
                                required
                            />
                            <div className="flex justify-end pt-1">
                                <span className={`text-xs ${content.length > 4000 ? 'text-orange-500' : 'text-text-secondary'}`}>
                                    {content.length}/5000
                                </span>
                            </div>
                        </div>

                        {/* Image URL */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark flex items-center gap-2">
                                <ImageIcon size={16} />
                                Add an Image (Optional)
                            </label>
                            <Input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                            />
                            {image && (
                                <div className="mt-4 rounded-xl overflow-hidden border border-border dark:border-border-dark bg-surface-alt dark:bg-surface-dark flex items-center justify-center p-2 h-48">
                                    <img
                                        src={image}
                                        alt="Post preview"
                                        className="h-full object-contain"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-border dark:border-border-dark">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate(`/groups/${id}`)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="gradient"
                                disabled={!content.trim() || submitting}
                                loading={submitting}
                            >
                                <Send size={16} />
                                Publish Post
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

export default CreatePostPage;
