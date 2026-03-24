import {
    createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { eventAPI } from '../services/api';

const EventContext = createContext(null);

const normalizeId = (value) => String(value || '');

const extractPayload = (response) => (response && typeof response === 'object' ? response : {});

const extractEvents = (response) => {
    const payload = extractPayload(response);

    if (Array.isArray(payload.events)) return payload.events;
    if (Array.isArray(payload.data?.events)) return payload.data.events;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload)) return payload;

    return [];
};

const extractEvent = (response) => {
    const payload = extractPayload(response);

    if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        return payload.data.event || payload.data;
    }

    return (
        payload.event
        || payload.data?.event
        || payload.data
        || payload
    );
};

const upsertEvent = (previousEvents, nextEvent) => {
    const safePrev = Array.isArray(previousEvents) ? previousEvents : [];
    if (!nextEvent || !nextEvent._id) return safePrev;

    const targetId = normalizeId(nextEvent._id);
    const exists = safePrev.some((event) => normalizeId(event?._id) === targetId);
    if (!exists) return [...safePrev, nextEvent];

    return safePrev.map((event) => (
        normalizeId(event?._id) === targetId ? nextEvent : event
    ));
};

export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await eventAPI.getAll({ limit: 1000 });
            const normalizedEvents = extractEvents(response);
            const safeEvents = Array.isArray(normalizedEvents) ? normalizedEvents : [];
            setEvents([...(safeEvents || [])]);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err);
            setEvents((prev) => (Array.isArray(prev) ? prev : []));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const getEventById = useCallback((id) => {
        const targetId = normalizeId(id);
        const safeEvents = Array.isArray(events) ? events : [];
        return safeEvents.find((event) => normalizeId(event?._id) === targetId) || null;
    }, [events]);

    const addEvent = useCallback(async (payload = {}) => {
        try {
            const response = await eventAPI.create(payload);
            const newEvent = extractEvent(response);

            if (!newEvent || !newEvent._id) {
                throw new Error('Failed to create event');
            }

            setEvents((prev) => [...(Array.isArray(prev) ? prev : []), newEvent]);
            setError(null);
            return newEvent;
        } catch (err) {
            console.error(err);
            setError(err);
            throw err;
        }
    }, []);

    const updateEvent = useCallback(async (id, payload = {}) => {
        try {
            const targetId = normalizeId(id);
            const response = await eventAPI.update(targetId, payload);
            const updatedEvent = extractEvent(response);

            if (!updatedEvent || !updatedEvent._id) {
                throw new Error('Failed to update event');
            }

            setEvents((prev) => (Array.isArray(prev) ? prev : []).map((event) => (
                normalizeId(event?._id) === targetId ? updatedEvent : event
            )));
            setError(null);
            return updatedEvent;
        } catch (err) {
            console.error(err);
            setError(err);
            throw err;
        }
    }, []);

    const deleteEvent = useCallback(async (id) => {
        try {
            const targetId = normalizeId(id);
            await eventAPI.delete(targetId);

            setEvents((prev) => (Array.isArray(prev) ? prev : []).filter(
                (event) => normalizeId(event?._id) !== targetId
            ));
            setError(null);
            return true;
        } catch (err) {
            console.error(err);
            setError(err);
            throw err;
        }
    }, []);

    const registerForEvent = useCallback(async (id, userId) => {
        try {
            const targetId = normalizeId(id);
            const targetUserId = normalizeId(userId);
            if (!targetUserId) {
                throw new Error('Valid user id required');
            }

            const response = await eventAPI.register(targetId, { userId: targetUserId });
            const updatedEvent = extractEvent(response);

            if (!updatedEvent || !updatedEvent._id) {
                throw new Error('Unable to register for this event');
            }

            setEvents((prev) => (Array.isArray(prev) ? prev : []).map((event) => (
                normalizeId(event?._id) === targetId ? updatedEvent : event
            )));
            setError(null);
            return updatedEvent;
        } catch (err) {
            console.error(err);
            setError(err);
            throw err;
        }
    }, []);

    const unregisterFromEvent = useCallback(async (id) => {
        try {
            const targetId = normalizeId(id);
            const response = await eventAPI.unregister(targetId);
            const updatedEvent = extractEvent(response);

            if (!updatedEvent || !updatedEvent._id) {
                throw new Error('Unable to unregister from this event');
            }

            setEvents((prev) => (Array.isArray(prev) ? prev : []).map((event) => (
                normalizeId(event?._id) === targetId ? updatedEvent : event
            )));
            setError(null);
            return updatedEvent;
        } catch (err) {
            console.error(err);
            setError(err);
            throw err;
        }
    }, []);

    const fetchEventById = useCallback(async (id) => {
        try {
            const targetId = normalizeId(id);
            if (!targetId) return null;

            const response = await eventAPI.getById(targetId);
            const fetchedEvent = extractEvent(response);

            if (!fetchedEvent || !fetchedEvent._id) {
                return null;
            }

            setEvents((prev) => upsertEvent(prev, fetchedEvent));
            setError(null);
            return fetchedEvent;
        } catch (err) {
            console.error(err);
            setError(err);
            return null;
        }
    }, []);

    const value = useMemo(() => ({
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventById,
        fetchEventById,
        registerForEvent,
        unregisterFromEvent,
        refreshEvents: fetchEvents,
    }), [
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventById,
        fetchEventById,
        registerForEvent,
        unregisterFromEvent,
        fetchEvents,
    ]);

    return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEventStore = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error('useEventStore must be used within an EventProvider');
    }
    return context;
};
