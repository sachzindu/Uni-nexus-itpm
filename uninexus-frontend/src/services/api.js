import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle errors globally
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message =
            error.response?.data?.message || error.message || 'Something went wrong';

        // Auto-logout on 401
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            const currentPath = window.location.pathname || '/';
            const isAdminRoute = currentPath.startsWith('/admin');
            const targetPath = isAdminRoute ? '/admin/login' : '/login';

            if (currentPath !== targetPath) {
                window.location.href = targetPath;
            }
        }

        return Promise.reject({ message, status: error.response?.status });
    }
);

// ─── Auth API ────────────────────────────────────────────────
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
};

// ─── User API ────────────────────────────────────────────────
export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    getAllUsers: (params) => api.get('/users', { params }),
    getRecommendations: (limit = 10) =>
        api.get('/users/recommendations', { params: { limit } }),
    getAdminStats: () => api.get('/users/admin/stats'),
    getUserById: (id) => api.get(`/users/${id}`),
    uploadProfilePhoto: (file) => {
        const formData = new FormData();
        formData.append('profilePhoto', file);
        return api.post('/users/profile/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    uploadGalleryPhotos: (files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('galleryPhotos', file));
        return api.post('/users/profile/gallery', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    deleteGalleryPhoto: (photoUrl) =>
        api.delete('/users/profile/gallery', { data: { photoUrl } }),
    getMyGroups: () => api.get('/users/my-groups'),
    getMyEvents: () => api.get('/users/my-events'),
};

// ─── Interest API ────────────────────────────────────────────
export const interestAPI = {
    getAll: () => api.get('/interests'),
    getById: (id) => api.get(`/interests/${id}`),
    getByCategory: (category) =>
        api.get(`/interests/category/${encodeURIComponent(category)}`),
    create: (data) => api.post('/interests', data),
    update: (id, data) => api.put(`/interests/${id}`, data),
    delete: (id) => api.delete(`/interests/${id}`),
};

// ─── Group API ───────────────────────────────────────────────
export const groupAPI = {
    getAll: (params) => api.get('/groups', { params }),
    getById: (id) => api.get(`/groups/${id}`),
    create: (data) => api.post('/groups', data),
    update: (id, data) => api.put(`/groups/${id}`, data),
    delete: (id) => api.delete(`/groups/${id}`),
    requestJoin: (id) => api.post(`/groups/${id}/join`),
    handleJoinRequest: (groupId, requestId, data) =>
        api.put(`/groups/${groupId}/join-requests/${requestId}`, data),
    leave: (id) => api.post(`/groups/${id}/leave`),
    getMembers: (id) => api.get(`/groups/${id}/members`),
    removeMember: (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`),
    promoteMember: (groupId, memberId) => api.post(`/groups/${groupId}/members/${memberId}/promote`),
};

// ─── Post API ────────────────────────────────────────────────
export const postAPI = {
    getByGroup: (groupId, params) =>
        api.get(`/groups/${groupId}/posts`, { params }),
    getById: (groupId, postId) =>
        api.get(`/groups/${groupId}/posts/${postId}`),
    create: (groupId, data) => api.post(`/groups/${groupId}/posts`, data),
    update: (groupId, postId, data) =>
        api.put(`/groups/${groupId}/posts/${postId}`, data),
    delete: (groupId, postId) =>
        api.delete(`/groups/${groupId}/posts/${postId}`),
    uploadImage: (groupId, formData) =>
        api.post(`/groups/${groupId}/posts/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    toggleUpvote: (groupId, postId) =>
        api.post(`/groups/${groupId}/posts/${postId}/upvote`),
    toggleDownvote: (groupId, postId) =>
        api.post(`/groups/${groupId}/posts/${postId}/downvote`),
    addComment: (groupId, postId, data) =>
        api.post(`/groups/${groupId}/posts/${postId}/comments`, data),
    getComments: (groupId, postId, params) =>
        api.get(`/groups/${groupId}/posts/${postId}/comments`, { params }),
    deleteComment: (groupId, postId, commentId) =>
        api.delete(`/groups/${groupId}/posts/${postId}/comments/${commentId}`),
    updateComment: (groupId, postId, commentId, data) =>
        api.put(`/groups/${groupId}/posts/${postId}/comments/${commentId}`, data),
};

export const eventAPI = {
    getAll: (params) => api.get('/events', { params }),
    getById: (id) => api.get(`/events/${id}`),
    getFeatured: () => api.get('/events/featured'),
    create: (data) => api.post('/events', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id, data) => api.put(`/events/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id) => api.delete(`/events/${id}`),
    register: (id, data) => api.post(`/events/${id}/register`, data),
    unregister: (id) => api.post(`/events/${id}/unregister`),
    getAttendees: (id) => api.get(`/events/${id}/attendees`),
    getDashboardStats: () => api.get('/events/dashboard'),
    // Admin: Get registered students for an event
    getAttendance: (eventId) => api.get(`/events/attendance/${eventId}`),
};

// ─── Chat API ────────────────────────────────────────────────
export const chatAPI = {
    getGroupMessages: (groupId, params) =>
        api.get(`/chat/${groupId}/messages`, { params }),
    getChatGroupMessages: (chatGroupId, params) =>
        api.get(`/chat/chat-groups/${chatGroupId}/messages`, { params }),
};

// ─── Chat Group API ──────────────────────────────────────────
export const chatGroupAPI = {
    getAll: () => api.get('/chat-groups'),
    getById: (id) => api.get(`/chat-groups/${id}`),
    create: (data) => api.post('/chat-groups', data),
    update: (id, data) => api.put(`/chat-groups/${id}`, data),
    addMembers: (id, data) => api.post(`/chat-groups/${id}/members`, data),
    removeMember: (id, memberId) =>
        api.delete(`/chat-groups/${id}/members/${memberId}`),
    leave: (id) => api.post(`/chat-groups/${id}/leave`),
};

// ─── Friend Request API ──────────────────────────────────────
export const friendRequestAPI = {
    send: (toUserId) => api.post('/friend-requests', { toUserId }),
    getReceived: () => api.get('/friend-requests/received'),
    respond: (id, status) => api.put(`/friend-requests/${id}`, { status }),
    getStatus: (userId) => api.get(`/friend-requests/status/${userId}`),
    getFriends: () => api.get('/friend-requests/friends'),
};

export default api;
