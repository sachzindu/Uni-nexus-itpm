import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle, Send, Clock, X, Pencil, Check,
} from 'lucide-react';
import { postAPI, groupAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import UserAvatar from '../components/ui/UserAvatar';

const PostDetailPage = () => {
    const { id: groupId, postId } = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const commentInputRef = useRef(null);

    const [post, setPost] = useState(null);
    const [group, setGroup] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [commentPagination, setCommentPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loadingMore, setLoadingMore] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState('');

    // Determine if the current user is a member of this group
    const isMember = group?.members?.some(
        (m) => (typeof m === 'string' ? m : m._id) === user?._id
    );

    // Fetch post, group, and initial comments
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postRes, grpRes, commentRes] = await Promise.allSettled([
                    postAPI.getById(groupId, postId),
                    groupAPI.getById(groupId),
                    postAPI.getComments(groupId, postId, { page: 1, limit: 5 }),
                ]);

                if (postRes.status === 'fulfilled') {
                    setPost(postRes.value?.data?.post || postRes.value?.data);
                } else {
                    toast.error('Failed to load post');
                    navigate(`/groups/${groupId}`);
                    return;
                }

                if (grpRes.status === 'fulfilled') {
                    setGroup(grpRes.value?.data?.group || grpRes.value?.data);
                }

                if (commentRes.status === 'fulfilled') {
                    setComments(commentRes.value?.data?.comments || []);
                    setCommentPagination(
                        commentRes.value?.data?.pagination || { page: 1, pages: 1, total: 0 }
                    );
                }
            } catch {
                toast.error('Failed to load post');
                navigate(`/groups/${groupId}`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [groupId, postId]);

    const handleUpvote = async () => {
        try {
            const res = await postAPI.toggleUpvote(groupId, postId);
            const updatedPost = res.data?.post;
            if (updatedPost) setPost((prev) => ({ ...prev, ...updatedPost }));
        } catch {
            toast.error('Failed to vote');
        }
    };

    const handleDownvote = async () => {
        try {
            const res = await postAPI.toggleDownvote(groupId, postId);
            const updatedPost = res.data?.post;
            if (updatedPost) setPost((prev) => ({ ...prev, ...updatedPost }));
        } catch {
            toast.error('Failed to vote');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        const trimmed = commentText.trim();
        if (!trimmed) return;

        setSubmitting(true);
        try {
            const res = await postAPI.addComment(groupId, postId, { content: trimmed });
            const newComment = res.data?.comment;
            if (newComment) {
                setComments((prev) => [newComment, ...prev]);
                setCommentPagination((prev) => ({ ...prev, total: prev.total + 1 }));
            }
            setCommentText('');
            // Update post comment count
            setPost((prev) =>
                prev
                    ? {
                          ...prev,
                          commentCount: (prev.commentCount ?? prev.comments?.length ?? 0) + 1,
                      }
                    : prev
            );
            toast.success('Comment added');
        } catch (err) {
            toast.error(err.message || 'Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDiscardComment = () => {
        setCommentText('');
        if (commentInputRef.current) {
            commentInputRef.current.blur();
        }
    };

    const handleLoadMore = async () => {
        if (commentPagination.page >= commentPagination.pages) return;
        setLoadingMore(true);
        try {
            const nextPage = commentPagination.page + 1;
            const res = await postAPI.getComments(groupId, postId, { page: nextPage, limit: 5 });
            const moreComments = res.data?.comments || [];
            setComments((prev) => [...prev, ...moreComments]);
            setCommentPagination(res.data?.pagination || commentPagination);
        } catch {
            toast.error('Failed to load more comments');
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (!post) return null;

    const hasUpvoted = post.upvotes?.includes(user?._id);
    const hasDownvoted = post.downvotes?.includes(user?._id);
    const voteScore =
        (post.upvoteCount || post.upvotes?.length || 0) -
        (post.downvoteCount || post.downvotes?.length || 0);
    const totalComments = commentPagination.total;
    const hasMore = commentPagination.page < commentPagination.pages;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back */}
            <button
                onClick={() => navigate(`/groups/${groupId}`)}
                className="flex items-center gap-2 text-text-secondary dark:text-text-dark-secondary
                    hover:text-text-primary dark:hover:text-text-dark mb-6 cursor-pointer"
            >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back to Group</span>
            </button>

            {/* Post Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card hover={false} className="mb-6">
                    {/* Author Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <UserAvatar user={post.author} size="sm" />
                        <div className="flex-1">
                            <p className="font-semibold text-text-primary dark:text-text-dark">
                                {post.author?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary flex items-center gap-1">
                                <Clock size={11} />
                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        {post.group?.name && (
                            <Badge variant="purple" className="text-[10px]">
                                {post.group.name}
                            </Badge>
                        )}
                    </div>

                    {/* Content */}
                    <p className="text-text-primary dark:text-text-dark whitespace-pre-wrap mb-4 leading-relaxed">
                        {post.content}
                    </p>
                    {post.image && (
                        <img
                            src={post.image}
                            alt="Post attachment"
                            className="rounded-2xl mb-4 max-h-[500px] object-cover w-full"
                        />
                    )}

                    {/* Vote Controls & Comment Count */}
                    <div className="flex items-center gap-5 pt-4 border-t border-border dark:border-border-dark">
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleUpvote}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                    hasUpvoted
                                        ? 'text-accent-purple bg-accent-purple/10'
                                        : 'text-text-secondary hover:text-accent-purple hover:bg-accent-purple/5'
                                }`}
                                title="Upvote"
                            >
                                <ThumbsUp size={20} className={hasUpvoted ? 'fill-accent-purple' : ''} />
                            </button>
                            <span
                                className={`text-lg font-bold min-w-[2.5ch] text-center ${
                                    voteScore > 0
                                        ? 'text-accent-purple'
                                        : voteScore < 0
                                        ? 'text-red-500'
                                        : 'text-text-secondary dark:text-text-dark-secondary'
                                }`}
                            >
                                {voteScore}
                            </span>
                            <button
                                onClick={handleDownvote}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                    hasDownvoted
                                        ? 'text-red-500 bg-red-500/10'
                                        : 'text-text-secondary hover:text-red-500 hover:bg-red-500/5'
                                }`}
                                title="Downvote"
                            >
                                <ThumbsDown size={20} className={hasDownvoted ? 'fill-red-500' : ''} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-text-secondary dark:text-text-dark-secondary">
                            <MessageCircle size={20} />
                            <span className="text-sm font-medium">
                                {totalComments} comment{totalComments !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Comment Section Header */}
            <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={18} className="text-accent-purple" />
                <h2 className="text-lg font-bold text-text-primary dark:text-text-dark">
                    Comments
                </h2>
            </div>

            {/* Add Comment — only for group members */}
            {isMember ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="bg-white dark:bg-surface-dark-alt rounded-2xl card-shadow p-4">
                        <div className="flex gap-3">
                            <UserAvatar user={user} size="xs" className="flex-shrink-0" />
                            <div className="flex-1">
                                <textarea
                                    ref={commentInputRef}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows={3}
                                    maxLength={2000}
                                    className="w-full px-4 py-2.5 bg-surface-alt dark:bg-surface-dark border border-border dark:border-border-dark
                                        rounded-xl text-sm text-text-primary dark:text-text-dark
                                        focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none
                                        placeholder:text-text-secondary/50"
                                />
                                {/* Character count */}
                                {commentText.length > 0 && (
                                    <p className="text-[10px] text-text-secondary dark:text-text-dark-secondary text-right mt-1">
                                        {commentText.length}/2000
                                    </p>
                                )}
                                {/* Add / Discard buttons — shown only when there's text */}
                                {commentText.trim().length > 0 && (
                                    <div className="flex justify-end gap-2 mt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDiscardComment}
                                        >
                                            <X size={14} />
                                            Discard
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="gradient"
                                            size="sm"
                                            loading={submitting}
                                            onClick={handleAddComment}
                                        >
                                            <Send size={14} />
                                            Add Comment
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="mb-6 px-4 py-3 bg-surface-alt dark:bg-surface-dark rounded-xl text-center">
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                        Join this group to comment on posts.
                    </p>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
                {comments.length > 0 ? (
                    <>
                        {comments.map((comment, index) => {
                            // Permission: comment author, post author, group admin, or platform admin
                            const isCommentAuthor = comment.user?._id === user?._id;
                            const isPostAuthor = post?.author?._id === user?._id;
                            const isPlatformAdmin = user?.role === 'admin';
                            const isGroupAdmin = group?.admins?.some((a) => (typeof a === 'string' ? a : a._id) === user?._id);
                            const canDelete = isCommentAuthor || isPostAuthor || isGroupAdmin || isPlatformAdmin;
                            const isEditing = editingCommentId === comment._id;
                            return (
                                <motion.div
                                    key={comment._id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * Math.min(index, 5) }}
                                >
                                    {/* Rectangle comment card */}
                                    <div className="bg-white dark:bg-surface-dark-alt rounded-xl border border-border dark:border-border-dark p-4">
                                        <div className="flex gap-3">
                                            {/* User avatar */}
                                            <div className="w-9 h-9 rounded-full gradient-bg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                                                {(comment.user?.name || 'U').charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {/* Name and time */}
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <p className="text-sm font-semibold text-text-primary dark:text-text-dark">
                                                        {comment.user?.name || 'Unknown User'}
                                                    </p>
                                                    <span className="text-[10px] text-text-secondary dark:text-text-dark-secondary flex items-center gap-0.5">
                                                        <Clock size={9} />
                                                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                    {isCommentAuthor && !isEditing && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="text-text-secondary hover:text-accent-purple hover:bg-accent-purple/10 ml-auto"
                                                            title="Edit comment"
                                                            aria-label="Edit comment"
                                                            onClick={() => {
                                                                setEditingCommentId(comment._id);
                                                                setEditText(comment.content);
                                                            }}
                                                        >
                                                            <Pencil size={13} />
                                                        </Button>
                                                    )}
                                                    {canDelete && !isEditing && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="text-error hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-error ml-2"
                                                            title="Delete comment"
                                                            aria-label="Delete comment"
                                                            onClick={async () => {
                                                                if (window.confirm('Delete this comment?')) {
                                                                    try {
                                                                        await postAPI.deleteComment(groupId, postId, comment._id);
                                                                        setComments((prev) => prev.filter((c) => c._id !== comment._id));
                                                                        setCommentPagination((prev) => ({ ...prev, total: prev.total - 1 }));
                                                                        toast.success('Comment deleted');
                                                                    } catch (err) {
                                                                        toast.error('Failed to delete comment');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <X size={14} />
                                                        </Button>
                                                    )}
                                                </div>
                                                {/* Comment text / inline edit */}
                                                {isEditing ? (
                                                    <div className="mt-1">
                                                        <textarea
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            rows={3}
                                                            maxLength={2000}
                                                            className="w-full px-3 py-2 bg-surface-alt dark:bg-surface-dark border border-border dark:border-border-dark
                                                                rounded-xl text-sm text-text-primary dark:text-text-dark
                                                                focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none"
                                                        />
                                                        <div className="flex justify-end gap-2 mt-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => { setEditingCommentId(null); setEditText(''); }}
                                                            >
                                                                <X size={13} /> Cancel
                                                            </Button>
                                                            <Button
                                                                variant="gradient"
                                                                size="sm"
                                                                onClick={async () => {
                                                                    const trimmed = editText.trim();
                                                                    if (!trimmed) return;
                                                                    try {
                                                                        const res = await postAPI.updateComment(groupId, postId, comment._id, { content: trimmed });
                                                                        const updated = res.data?.data?.comment;
                                                                        setComments((prev) =>
                                                                            prev.map((c) =>
                                                                                c._id === comment._id
                                                                                    ? { ...c, content: updated?.content ?? trimmed }
                                                                                    : c
                                                                            )
                                                                        );
                                                                        setEditingCommentId(null);
                                                                        setEditText('');
                                                                        toast.success('Comment updated');
                                                                    } catch (err) {
                                                                        toast.error('Failed to update comment');
                                                                    }
                                                                }}
                                                            >
                                                                <Check size={13} /> Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-text-primary dark:text-text-dark whitespace-pre-wrap leading-relaxed">
                                                        {comment.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleLoadMore}
                                    loading={loadingMore}
                                >
                                    <MessageCircle size={14} />
                                    See More Comments
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white dark:bg-surface-dark-alt rounded-xl border border-border dark:border-border-dark p-8 text-center">
                        <MessageCircle size={36} className="mx-auto mb-2 text-text-secondary/20" />
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            No comments yet. Be the first to share your thoughts!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostDetailPage;
