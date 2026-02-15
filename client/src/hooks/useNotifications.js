import { useState, useEffect, useCallback, useRef } from 'react';
import { appointmentsApi } from '../api';

const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const notifiedIds = useRef(new Set());
  const checkIntervalRef = useRef(null);

  // طلب إذن الإشعارات
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('هذا المتصفح لا يدعم الإشعارات');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }

    setPermission('denied');
    return false;
  }, []);

  // إرسال إشعار
  const sendNotification = useCallback((title, options = {}) => {
    if (permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      dir: 'rtl',
      lang: 'ar',
      requireInteraction: true,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) {
        options.onClick();
      }
    };

    // إغلاق تلقائي بعد 30 ثانية
    setTimeout(() => notification.close(), 30000);

    return notification;
  }, [permission]);

  // فحص المواعيد القادمة
  const checkUpcomingAppointments = useCallback(async () => {
    if (permission !== 'granted') return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await appointmentsApi.getAppointments({
        date: today,
        status: 'pending,confirmed'
      });

      const appointments = response.data?.data?.appointments || [];
      const now = new Date();

      appointments.forEach(apt => {
        // تجاهل المواعيد التي تم إرسال إشعار لها
        if (notifiedIds.current.has(apt._id)) return;

        const aptTime = new Date(`${apt.date}T${apt.time}`);
        const timeDiff = (aptTime - now) / (1000 * 60); // الفرق بالدقائق

        // إشعار قبل 30 دقيقة
        if (timeDiff > 0 && timeDiff <= 30) {
          const customerName = apt.customer?.name || apt.customerName || 'عميل';
          const personsCount = apt.personsCount || 1;

          sendNotification(`موعد قادم - ${customerName}`, {
            body: `الموعد بعد ${Math.round(timeDiff)} دقيقة\nعدد الأشخاص: ${personsCount}`,
            tag: `appointment-${apt._id}`,
            onClick: () => {
              // يمكن إضافة توجيه للموعد
            }
          });

          notifiedIds.current.add(apt._id);
        }

        // إشعار قبل 5 دقائق
        if (timeDiff > 0 && timeDiff <= 5 && !notifiedIds.current.has(`${apt._id}-5min`)) {
          const customerName = apt.customer?.name || apt.customerName || 'عميل';

          sendNotification(`⚠️ موعد وشيك - ${customerName}`, {
            body: `الموعد بعد ${Math.round(timeDiff)} دقيقة!`,
            tag: `appointment-${apt._id}-5min`,
            onClick: () => {
              // يمكن إضافة توجيه للموعد
            }
          });

          notifiedIds.current.add(`${apt._id}-5min`);
        }
      });

      setUpcomingAppointments(appointments.filter(apt => {
        const aptTime = new Date(`${apt.date}T${apt.time}`);
        const timeDiff = (aptTime - now) / (1000 * 60);
        return timeDiff > 0 && timeDiff <= 60;
      }));

    } catch (error) {
      console.error('خطأ في جلب المواعيد:', error);
    }
  }, [permission, sendNotification]);

  // بدء المراقبة
  const startMonitoring = useCallback(() => {
    if (checkIntervalRef.current) return;

    // فحص فوري
    checkUpcomingAppointments();

    // فحص كل دقيقة
    checkIntervalRef.current = setInterval(checkUpcomingAppointments, 60000);
  }, [checkUpcomingAppointments]);

  // إيقاف المراقبة
  const stopMonitoring = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // إشعار مخصص
  const notify = useCallback((title, body, options = {}) => {
    return sendNotification(title, { body, ...options });
  }, [sendNotification]);

  // فحص الإذن عند التحميل
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // تنظيف عند الإغلاق
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    permission,
    requestPermission,
    notify,
    sendNotification,
    startMonitoring,
    stopMonitoring,
    upcomingAppointments,
    isSupported: 'Notification' in window
  };
};

export default useNotifications;
