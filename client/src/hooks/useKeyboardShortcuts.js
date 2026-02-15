import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useKeyboardShortcuts = (customShortcuts = {}) => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  // الاختصارات الافتراضية
  const defaultShortcuts = {
    // التنقل السريع (Alt + حرف)
    'alt+h': { action: () => navigate('/'), description: 'الرئيسية', category: 'التنقل' },
    'alt+a': { action: () => navigate('/appointments'), description: 'المواعيد', category: 'التنقل' },
    'alt+c': { action: () => navigate('/customers'), description: 'العملاء', category: 'التنقل' },
    'alt+i': { action: () => navigate('/invoices'), description: 'الفواتير', category: 'التنقل' },
    'alt+r': { action: () => navigate('/reports'), description: 'التقارير', category: 'التنقل' },
    'alt+s': { action: () => navigate('/settings'), description: 'الإعدادات', category: 'التنقل' },
    'alt+e': { action: () => navigate('/employees'), description: 'الموظفين', category: 'التنقل' },
    'alt+d': { action: () => navigate('/departments'), description: 'الأقسام', category: 'التنقل' },
    'alt+f': { action: () => navigate('/financial'), description: 'المالية', category: 'التنقل' },

    // إجراءات سريعة (Ctrl + حرف)
    'ctrl+n': { action: () => navigate('/appointments/new'), description: 'موعد جديد', category: 'إجراءات' },
    'ctrl+shift+n': { action: () => navigate('/customers/new'), description: 'عميل جديد', category: 'إجراءات' },
    'ctrl+shift+i': { action: () => navigate('/invoices/new'), description: 'فاتورة جديدة', category: 'إجراءات' },

    // بحث (Ctrl + K أو /)
    'ctrl+k': { action: () => document.querySelector('[data-search-input]')?.focus(), description: 'التركيز على البحث', category: 'بحث' },
    '/': { action: () => document.querySelector('[data-search-input]')?.focus(), description: 'التركيز على البحث', category: 'بحث', ignoreInInput: true },

    // مساعدة
    '?': { action: () => setShowHelp(prev => !prev), description: 'عرض/إخفاء الاختصارات', category: 'مساعدة', ignoreInInput: true },
    'escape': { action: () => setShowHelp(false), description: 'إغلاق النوافذ', category: 'مساعدة' },
  };

  // دمج الاختصارات المخصصة مع الافتراضية
  const shortcuts = { ...defaultShortcuts, ...customShortcuts };

  // تحويل مفتاح الاختصار إلى صيغة موحدة
  const normalizeKey = useCallback((event) => {
    // التحقق من وجود event.key
    if (!event || !event.key) return '';

    const parts = [];
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'arrowup') key = 'up';
    if (key === 'arrowdown') key = 'down';
    if (key === 'arrowleft') key = 'left';
    if (key === 'arrowright') key = 'right';

    parts.push(key);
    return parts.join('+');
  }, []);

  // معالج الأحداث
  const handleKeyDown = useCallback((event) => {
    // تجاهل إذا كان المستخدم يكتب في حقل إدخال
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
                          document.activeElement?.isContentEditable;

    const key = normalizeKey(event);
    const shortcut = shortcuts[key];

    if (shortcut) {
      // بعض الاختصارات يجب تجاهلها عند الكتابة
      if (shortcut.ignoreInInput && isInputFocused) return;

      // منع السلوك الافتراضي للاختصار
      event.preventDefault();
      event.stopPropagation();

      // تنفيذ الإجراء
      shortcut.action();
    }
  }, [shortcuts, normalizeKey]);

  // تسجيل وإلغاء تسجيل الأحداث
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // الحصول على قائمة الاختصارات للعرض
  const getShortcutsList = useCallback(() => {
    const categories = {};

    Object.entries(shortcuts).forEach(([key, value]) => {
      const category = value.category || 'أخرى';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({
        key: key.replace('ctrl', 'Ctrl').replace('alt', 'Alt').replace('shift', 'Shift').replace('+', ' + '),
        description: value.description
      });
    });

    return categories;
  }, [shortcuts]);

  return {
    showHelp,
    setShowHelp,
    getShortcutsList,
    shortcuts
  };
};

export default useKeyboardShortcuts;
