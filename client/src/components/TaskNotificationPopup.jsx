import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyTaskNotificationsAPI, markTaskAsReadAPI } from '../services/api';
import {
  Bell,
  CheckCircle2,
  Calendar,
  UserCheck,
  X,
  ExternalLink,
  Flame,
  Tag,
} from 'lucide-react';

const PRIORITY_BADGES = {
  URGENT: 'bg-rose-500 text-white',
  HIGH: 'bg-amber-500 text-white',
  MEDIUM: 'bg-indigo-500 text-white',
  LOW: 'bg-slate-500 text-white',
};

const TaskNotificationPopup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await getMyTaskNotificationsAPI();
      if (res.success && res.data && res.data.length > 0) {
        setNotifications(res.data);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Error fetching task notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000); // Check every 25 seconds
    return () => clearInterval(interval);
  }, [user]);

  if (!user || !isOpen || notifications.length === 0) return null;

  const currentTask = notifications[currentTaskIndex] || notifications[0];
  if (!currentTask) return null;

  const handleAcknowledge = async () => {
    try {
      await markTaskAsReadAPI(currentTask.id);
      const remaining = notifications.filter((t) => t.id !== currentTask.id);
      setNotifications(remaining);
      if (remaining.length === 0) {
        setIsOpen(false);
      } else {
        setCurrentTaskIndex(0);
      }
    } catch (err) {
      console.error('Failed to acknowledge task:', err);
    }
  };

  const handleGoToTasks = async () => {
    await handleAcknowledge();
    navigate('/tasks');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999] max-w-md w-full animate-bounce-short">
      <div className="glass-card p-6 border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/20 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md rounded-2xl relative space-y-4">
        {/* Top Header Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500 text-white animate-pulse">
              <Bell size={18} />
            </span>
            <div>
              <h3 className="font-extrabold text-xs tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
                New Task Assigned to You!
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">
                Notification {currentTaskIndex + 1} of {notifications.length}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Task Details Content */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${PRIORITY_BADGES[currentTask.priority] || PRIORITY_BADGES.MEDIUM}`}>
              {currentTask.priority}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {currentTask.category?.replace('_', ' ')}
            </span>
          </div>

          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 leading-snug">
            {currentTask.title}
          </h4>

          {currentTask.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              {currentTask.description}
            </p>
          )}

          <div className="pt-2 flex flex-col gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <UserCheck size={13} className="text-indigo-500" />
              <span>Assigned by: <strong>{currentTask.createdBy?.name || 'Superadmin'}</strong></span>
            </div>

            {currentTask.dueDate && (
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-amber-500" />
                <span>Target Due Date: <strong>{new Date(currentTask.dueDate).toLocaleDateString()}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
          <button
            onClick={handleGoToTasks}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
          >
            Open Task Board <ExternalLink size={12} />
          </button>
          <button
            onClick={handleAcknowledge}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1 transition-all"
          >
            <CheckCircle2 size={13} /> Acknowledge & Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskNotificationPopup;
