import { useEffect, useRef, useState } from 'react';
import { alertsAPI } from '../lib/api';
import { toast } from 'sonner';

/**
 * Hook for real-time alert notifications
 * Polls for new alerts and shows browser notifications
 */
export function useNotifications(enabled = true) {
  const [lastCheckTime, setLastCheckTime] = useState(new Date().toISOString());
  const [newAlertsCount, setNewAlertsCount] = useState(0);
  const intervalRef = useRef(null);
  const notificationPermissionRef = useRef(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        notificationPermissionRef.current = permission;
      });
    } else if ('Notification' in window) {
      notificationPermissionRef.current = Notification.permission;
    }
  }, []);

  // Poll for new alerts
  useEffect(() => {
    if (!enabled) return;

    const checkForNewAlerts = async () => {
      try {
        const response = await alertsAPI.getNew(lastCheckTime);
        const newAlerts = response.data || [];

        if (newAlerts.length > 0) {
          setNewAlertsCount((prev) => prev + newAlerts.length);

          // Show browser notification for each new alert
          newAlerts.forEach((alert) => {
            // Show toast notification
            const alertTypeColors = {
              emergency: 'error',
              warning: 'warning',
              announcement: 'info',
              info: 'info',
            };

            toast[alertTypeColors[alert.type] || 'info'](alert.title, {
              description: alert.message.substring(0, 100) + (alert.message.length > 100 ? '...' : ''),
              duration: 5000,
            });

            // Show browser notification if permission granted
            if (
              'Notification' in window &&
              notificationPermissionRef.current === 'granted'
            ) {
              new Notification(`New ${alert.type} Alert: ${alert.title}`, {
                body: alert.message.substring(0, 200),
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `alert-${alert.id}`,
                requireInteraction: alert.type === 'emergency' || alert.priority === 'high',
              });
            }
          });

          // Update last check time
          setLastCheckTime(new Date().toISOString());
        }
      } catch (error) {
        // Silently fail - don't spam errors for polling
        if (error.response?.status !== 401) {
          console.error('Error checking for new alerts:', error);
        }
      }
    };

    // Check immediately
    checkForNewAlerts();

    // Poll every 30 seconds
    intervalRef.current = setInterval(checkForNewAlerts, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, lastCheckTime]);

  const resetNewAlertsCount = () => {
    setNewAlertsCount(0);
  };

  return {
    newAlertsCount,
    resetNewAlertsCount,
    hasPermission: notificationPermissionRef.current === 'granted',
  };
}

