import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notesApi, departmentsApi, customersApi } from '../../api';
import { Card, Loader, Modal } from '../../components/common';
import { useToast } from '../../context';
import './Notes.css';

// أنواع التذكير مع أيقونات وألوان مميزة
const REMINDER_TYPES = [
  { value: 'call', label: 'مكالمة', icon: '📞', color: '#3b82f6' },
  { value: 'meeting', label: 'اجتماع', icon: '👥', color: '#8b5cf6' },
  { value: 'follow_up', label: 'متابعة', icon: '🔄', color: '#f59e0b' },
  { value: 'task', label: 'مهمة', icon: '✅', color: '#10b981' },
  { value: 'other', label: 'أخرى', icon: '📌', color: '#6b7280' }
];

const REMINDER_TYPE_MAP = REMINDER_TYPES.reduce((acc, t) => { acc[t.value] = t; return acc; }, {});

// خيارات وقت التذكير — 6ص إلى 10م بفواصل 15 دقيقة
const REMINDER_TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const period = h < 12 ? 'ص' : 'م';
      const disp = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      opts.push({ value: `${hh}:${mm}`, label: `${disp}:${mm} ${period}` });
    }
  }
  return opts;
})();

const Notes = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or table
  const [activeTab, setActiveTab] = useState('drafts'); // drafts or quickNotes
  const [quickNotes, setQuickNotes] = useState([]);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [editingQuickNote, setEditingQuickNote] = useState(null);
  const [quickNoteData, setQuickNoteData] = useState({ title: '', content: '', color: '#fef3c7' });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [convertingNote, setConvertingNote] = useState(null);
  const [saving, setSaving] = useState(false);

  const [openActionsMenu, setOpenActionsMenu] = useState(null);
  const actionsMenuRef = useRef(null);

  // Form data
  const [formData, setFormData] = useState({
    customerName: '',
    customer: '',
    phone: '',
    title: '',
    notes: '',
    visibility: 'private',
    priority: 'medium',
    reminderEnabled: true,
    reminderDate: '',
    reminderTime: '09:00',
    reminderType: 'other',
    subTasks: [],
    emailNotification: false,
    department: ''
  });

  // Convert form data
  const [convertData, setConvertData] = useState({
    type: 'confirmed',
    appointmentDate: '',
    appointmentTime: '08:00',
    duration: 5,
    dateFrom: '',
    dateTo: '',
    department: '',
    city: 'الرياض'
  });

  useEffect(() => {
    fetchData();
    loadQuickNotes();
  }, []);

  const loadQuickNotes = () => {
    const saved = localStorage.getItem('quickNotes');
    if (saved) {
      setQuickNotes(JSON.parse(saved));
    }
  };

  const saveQuickNotes = (notes) => {
    localStorage.setItem('quickNotes', JSON.stringify(notes));
    setQuickNotes(notes);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setOpenActionsMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notesRes, depsRes, custRes, statsRes] = await Promise.all([
        notesApi.getNotes(),
        departmentsApi.getDepartments(),
        customersApi.getCustomers().catch(() => ({ data: { customers: [] } })),
        notesApi.getStats()
      ]);

      setNotes(notesRes.data?.data?.notes || notesRes.data?.notes || []);
      setDepartments(depsRes.data?.data?.departments || depsRes.data?.departments || []);
      setCustomers(custRes.data?.customers || []);
      setStats(statsRes.data?.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = (note = null, presetType = null) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        customerName: note.customerName || '',
        customer: note.customer?._id || '',
        phone: note.phone || '',
        title: note.title || '',
        notes: note.notes || '',
        visibility: note.visibility || 'private',
        priority: note.priority || 'medium',
        reminderEnabled: note.reminderEnabled !== false,
        reminderDate: note.reminderDate ? new Date(note.reminderDate).toISOString().split('T')[0] : '',
        reminderTime: note.reminderTime || '09:00',
        reminderType: note.reminderType || 'other',
        subTasks: Array.isArray(note.subTasks) ? note.subTasks.map(t => ({ title: t.title, completed: !!t.completed })) : [],
        emailNotification: !!note.emailNotification,
        department: note.department?._id || ''
      });
    } else {
      setEditingNote(null);
      setFormData({
        customerName: '',
        customer: '',
        phone: '',
        title: '',
        notes: '',
        visibility: 'private',
        priority: 'medium',
        reminderEnabled: true,
        reminderDate: '',
        reminderTime: '09:00',
        reminderType: presetType || 'other',
        subTasks: [],
        emailNotification: false,
        department: ''
      });
    }
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      showToast('اسم العميل مطلوب', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingNote) {
        await notesApi.updateNote(editingNote._id, formData);
      } else {
        await notesApi.createNote(formData);
      }
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving note:', error);
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المسودة؟')) {
      try {
        await notesApi.deleteNote(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const handleStatusChange = async (id, status, action = null) => {
    try {
      await notesApi.changeStatus(id, { status, action });
      fetchData();
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const handleOpenConvertModal = (note) => {
    setConvertingNote(note);
    setConvertData({
      type: 'confirmed',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '08:00',
      duration: 5,
      dateFrom: '',
      dateTo: '',
      department: note.department?._id || '',
      city: 'الرياض'
    });
    setShowConvertModal(true);
    setOpenActionsMenu(null);
  };

  const handleConvertToAppointment = async () => {
    if (convertData.type === 'confirmed' && (!convertData.appointmentDate || !convertData.department)) {
      showToast('يرجى تحديد التاريخ والقسم', 'warning');
      return;
    }
    if (convertData.type === 'unconfirmed' && (!convertData.dateFrom || !convertData.dateTo || !convertData.department)) {
      showToast('يرجى تحديد نطاق التاريخ والقسم', 'warning');
      return;
    }

    setSaving(true);
    try {
      await notesApi.convertToAppointment(convertingNote._id, convertData);
      setShowConvertModal(false);
      fetchData();
      showToast('تم تحويل المسودة لموعد بنجاح', 'success');
    } catch (error) {
      console.error('Error converting note:', error);
      showToast('حدث خطأ أثناء التحويل', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendWhatsApp = (note) => {
    const phone = note.phone?.replace(/[^0-9]/g, '');
    const phoneNumber = phone?.startsWith('0') ? '966' + phone.slice(1) : phone;
    const message = note.notes || `مرحباً ${note.customerName}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    setOpenActionsMenu(null);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !search ||
      note.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      note.phone?.includes(search) ||
      note.title?.toLowerCase().includes(search.toLowerCase()) ||
      note.notes?.toLowerCase().includes(search.toLowerCase());

    const matchesVisibility = !filterVisibility || note.visibility === filterVisibility;
    const matchesStatus = !filterStatus || note.status === filterStatus;
    const matchesPriority = !filterPriority || note.priority === filterPriority;

    return matchesSearch && matchesVisibility && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status) => {
    const map = {
      active: { label: 'نشط', class: 'status-active', icon: '🔵' },
      completed: { label: 'مكتمل', class: 'status-completed', icon: '✅' },
      cancelled: { label: 'ملغي', class: 'status-cancelled', icon: '❌' }
    };
    return map[status] || map.active;
  };

  const getPriorityBadge = (priority) => {
    const map = {
      low: { label: 'منخفض', class: 'priority-low' },
      medium: { label: 'متوسط', class: 'priority-medium' },
      high: { label: 'عالي', class: 'priority-high' }
    };
    return map[priority] || map.medium;
  };

  const getVisibilityBadge = (visibility) => {
    return visibility === 'public'
      ? { label: 'عام', class: 'visibility-public', icon: '🌐' }
      : { label: 'خاص', class: 'visibility-private', icon: '🔒' };
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatTimeDisplay = (time) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h < 12 ? 'ص' : 'م';
    const displayHour = h > 12 ? h - 12 : h;
    return `${displayHour}:${minutes} ${period}`;
  };

  const hourSlots = Array.from({ length: 7 }, (_, i) => {
    const hour = i + 8;
    const h = hour.toString().padStart(2, '0');
    const period = hour < 12 ? 'ص' : 'م';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return { value: `${h}:00`, label: `${displayHour} ${period}` };
  });

  // Quick Notes Functions
  const handleOpenQuickNoteModal = (note = null) => {
    if (note) {
      setEditingQuickNote(note);
      setQuickNoteData({ title: note.title, content: note.content, color: note.color });
    } else {
      setEditingQuickNote(null);
      setQuickNoteData({ title: '', content: '', color: '#fef3c7' });
    }
    setShowQuickNoteModal(true);
  };

  const handleSaveQuickNote = () => {
    if (!quickNoteData.content.trim()) {
      showToast('محتوى الملاحظة مطلوب', 'warning');
      return;
    }

    if (editingQuickNote) {
      const updated = quickNotes.map(n =>
        n.id === editingQuickNote.id ? { ...n, ...quickNoteData, updatedAt: new Date().toISOString() } : n
      );
      saveQuickNotes(updated);
    } else {
      const newNote = {
        id: Date.now().toString(),
        ...quickNoteData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveQuickNotes([newNote, ...quickNotes]);
    }
    setShowQuickNoteModal(false);
  };

  const handleDeleteQuickNote = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
      saveQuickNotes(quickNotes.filter(n => n.id !== id));
    }
  };

  const noteColors = [
    { value: '#fef3c7', label: 'أصفر' },
    { value: '#dbeafe', label: 'أزرق' },
    { value: '#d1fae5', label: 'أخضر' },
    { value: '#fce7f3', label: 'وردي' },
    { value: '#e0e7ff', label: 'بنفسجي' },
    { value: '#fff', label: 'أبيض' }
  ];

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="notes-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span>لوحة التحكم</span>
        <span className="separator">/</span>
        <span className="current">المسودات والتذاكير</span>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total || 0}</span>
            <span className="stat-label">إجمالي المسودات</span>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon">🔵</div>
          <div className="stat-info">
            <span className="stat-value">{stats.active || 0}</span>
            <span className="stat-label">نشطة</span>
          </div>
        </div>
        <div className="stat-card stat-today">
          <div className="stat-icon">🔔</div>
          <div className="stat-info">
            <span className="stat-value">{stats.todayReminders || 0}</span>
            <span className="stat-label">تذكيرات اليوم</span>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.completed || 0}</span>
            <span className="stat-label">مكتملة</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="notes-tabs">
        <button
          className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          📝 المسودات والتذاكير
        </button>
        <button
          className={`tab-btn ${activeTab === 'quickNotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quickNotes')}
        >
          📌 ملاحظات سريعة
        </button>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="header-right">
          {activeTab === 'drafts' ? (
            <div className="header-actions-group">
              <button className="add-btn" onClick={() => handleOpenAddModal()}>
                <span>+</span>
                إضافة مسودة
              </button>
              <button className="add-btn reminder-btn" onClick={() => handleOpenAddModal(null, 'call')}>
                <span>🔔</span>
                إضافة تذكير
              </button>
            </div>
          ) : (
            <button className="add-btn" onClick={() => handleOpenQuickNoteModal()}>
              <span>+</span>
              إضافة ملاحظة
            </button>
          )}
        </div>
        <div className="header-left">
          {activeTab === 'drafts' && (
            <>
              <select
                className="filter-select"
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
              >
                <option value="">الكل</option>
                <option value="public">عام</option>
                <option value="private">خاص</option>
              </select>
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
              <select
                className="filter-select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="">جميع الأولويات</option>
                <option value="high">عالي</option>
                <option value="medium">متوسط</option>
                <option value="low">منخفض</option>
              </select>
            </>
          )}
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {activeTab === 'drafts' && (
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="عرض شبكة"
              >
                ⊞
              </button>
              <button
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="عرض جدول"
              >
                ☰
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Notes Tab */}
      {activeTab === 'quickNotes' && (
        <div className="quick-notes-section">
          {quickNotes.length === 0 ? (
            <div className="empty-quick-notes">
              <span className="empty-icon">📌</span>
              <p>لا توجد ملاحظات سريعة</p>
              <button className="add-btn small" onClick={() => handleOpenQuickNoteModal()}>
                + إضافة ملاحظة
              </button>
            </div>
          ) : (
            <div className="quick-notes-grid">
              {quickNotes
                .filter(n => !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
                .map(note => (
                  <div
                    key={note.id}
                    className="quick-note-card"
                    style={{ backgroundColor: note.color }}
                  >
                    {note.title && <h4 className="quick-note-title">{note.title}</h4>}
                    <p className="quick-note-content">{note.content}</p>
                    <div className="quick-note-footer">
                      <span className="quick-note-date">
                        {new Date(note.updatedAt).toLocaleDateString('ar-u-nu-latn')}
                      </span>
                      <div className="quick-note-actions">
                        <button onClick={() => handleOpenQuickNoteModal(note)} title="تعديل">✏️</button>
                        <button onClick={() => handleDeleteQuickNote(note.id)} title="حذف">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Drafts Tab */}
      {activeTab === 'drafts' && viewMode === 'grid' && (
        <div className="notes-grid">
          {filteredNotes.length === 0 ? (
            <div className="empty-grid">لا توجد مسودات</div>
          ) : (
            filteredNotes.map(note => {
              const visibilityInfo = getVisibilityBadge(note.visibility);
              const priorityInfo = getPriorityBadge(note.priority);
              const statusInfo = getStatusBadge(note.status);

              const rt = REMINDER_TYPE_MAP[note.reminderType] || REMINDER_TYPE_MAP.other;
              const totalTasks = (note.subTasks || []).length;
              const doneTasks = (note.subTasks || []).filter(t => t.completed).length;
              const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              return (
                <div key={note._id} className="note-card" style={{ borderTop: `4px solid ${rt.color}` }}>
                  <div className="note-card-main">
                    <div className="note-card-header">
                      <span className="reminder-type-badge" style={{ background: rt.color + '20', color: rt.color }}>
                        {rt.icon} {rt.label}
                      </span>
                      <div className="note-card-header-badges">
                        <span className={`visibility-badge ${visibilityInfo.class}`}>
                          {visibilityInfo.icon}
                        </span>
                        <span className={`priority-badge ${priorityInfo.class}`}>
                          {priorityInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className="note-card-body">
                      <h4 className="note-customer">
                        {note.customer ? (
                          <button
                            className="customer-link"
                            onClick={() => navigate(`/control/customers/${note.customer._id}`)}
                          >
                            {note.customerName}
                          </button>
                        ) : note.customerName}
                      </h4>
                      {note.phone && <p className="note-phone" dir="ltr">{note.phone}</p>}
                      {note.title && <p className="note-title-text">{note.title}</p>}
                      {note.notes && (
                        <p className="note-content">
                          {note.notes.length > 100 ? note.notes.substring(0, 100) + '...' : note.notes}
                        </p>
                      )}
                      {note.reminderEnabled && note.reminderDate && (
                        <div className="note-reminder">
                          🔔 {formatDateDisplay(note.reminderDate)} - {formatTimeDisplay(note.reminderTime)}
                          {note.emailNotification && <span className="email-indicator" title="تنبيه بالبريد مفعّل">📧</span>}
                        </div>
                      )}
                      {totalTasks > 0 && (
                        <div className="subtasks-progress">
                          <div className="subtasks-progress-info">
                            <span>📋 {doneTasks}/{totalTasks} مهام</span>
                            <span className="subtasks-progress-percent">{taskProgress}%</span>
                          </div>
                          <div className="subtasks-progress-bar">
                            <div className="subtasks-progress-fill" style={{ width: `${taskProgress}%`, background: rt.color }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="note-card-footer">
                      <span className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="note-card-actions-vertical">
                    <button onClick={() => { setViewingNote(note); setShowViewModal(true); }} title="عرض" className="card-action-btn view">👁️</button>
                    <button onClick={() => handleOpenAddModal(note)} title="تعديل" className="card-action-btn edit">✏️</button>
                    {note.phone && <button onClick={() => handleSendWhatsApp(note)} title="واتساب" className="card-action-btn whatsapp">📱</button>}
                    {note.status === 'active' && (
                      <button onClick={() => handleOpenConvertModal(note)} title="تحويل لموعد" className="card-action-btn convert">🔄</button>
                    )}
                    <button onClick={() => handleDelete(note._id)} title="حذف" className="card-action-btn delete">🗑️</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Notes Table */}
      {activeTab === 'drafts' && viewMode === 'table' && (
      <Card className="table-card">
        <table className="notes-table">
          <thead>
            <tr>
              <th>النوع</th>
              <th>العميل</th>
              <th>رقم الجوال</th>
              <th>العنوان</th>
              <th>التذكير</th>
              <th>الأولوية</th>
              <th>الحالة</th>
              <th>مضاف بواسطة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-row">
                  لا توجد مسودات
                </td>
              </tr>
            ) : (
              filteredNotes.map(note => {
                const visibilityInfo = getVisibilityBadge(note.visibility);
                const priorityInfo = getPriorityBadge(note.priority);
                const statusInfo = getStatusBadge(note.status);

                return (
                  <tr key={note._id}>
                    <td>
                      <span className={`visibility-badge ${visibilityInfo.class}`}>
                        {visibilityInfo.icon} {visibilityInfo.label}
                      </span>
                    </td>
                    <td className="customer-name">
                      {note.customer ? (
                        <button
                          className="customer-link"
                          onClick={() => navigate(`/control/customers/${note.customer._id}`)}
                        >
                          {note.customerName}
                        </button>
                      ) : (
                        <span>{note.customerName}</span>
                      )}
                    </td>
                    <td dir="ltr">{note.phone || '-'}</td>
                    <td>
                      <span className="title-preview">
                        {note.title || (note.notes?.substring(0, 30) + (note.notes?.length > 30 ? '...' : '')) || '-'}
                      </span>
                    </td>
                    <td>
                      {note.reminderEnabled && note.reminderDate ? (
                        <div className="reminder-info">
                          <span className="reminder-date">{formatDateDisplay(note.reminderDate)}</span>
                          <span className="reminder-time">{formatTimeDisplay(note.reminderTime)}</span>
                        </div>
                      ) : (
                        <span className="no-reminder">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`priority-badge ${priorityInfo.class}`}>
                        {priorityInfo.label}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </td>
                    <td>{note.createdBy?.name || '-'}</td>
                    <td className="actions-cell">
                      <div className="actions-dropdown-wrapper" ref={openActionsMenu === note._id ? actionsMenuRef : null}>
                        <button
                          className="actions-menu-btn"
                          onClick={() => setOpenActionsMenu(openActionsMenu === note._id ? null : note._id)}
                        >
                          ⋮
                        </button>
                        {openActionsMenu === note._id && (
                          <div className="actions-dropdown-menu">
                            <button className="action-menu-item" onClick={() => { setViewingNote(note); setShowViewModal(true); setOpenActionsMenu(null); }}>
                              <span>👁️</span>
                              عرض التفاصيل
                            </button>
                            <button className="action-menu-item" onClick={() => { handleOpenAddModal(note); setOpenActionsMenu(null); }}>
                              <span>✏️</span>
                              تعديل
                            </button>
                            {note.phone && (
                              <button className="action-menu-item" onClick={() => handleSendWhatsApp(note)}>
                                <span>📱</span>
                                رسالة واتساب
                              </button>
                            )}
                            <div className="menu-divider"></div>
                            {note.status === 'active' && (
                              <>
                                <button className="action-menu-item convert" onClick={() => handleOpenConvertModal(note)}>
                                  <span>🔄</span>
                                  تحويل لموعد
                                </button>
                                <button className="action-menu-item success" onClick={() => { handleStatusChange(note._id, 'completed', 'called'); setOpenActionsMenu(null); }}>
                                  <span>✔️</span>
                                  تم الاتصال
                                </button>
                                <button className="action-menu-item success" onClick={() => { handleStatusChange(note._id, 'completed'); setOpenActionsMenu(null); }}>
                                  <span>✅</span>
                                  مكتمل
                                </button>
                              </>
                            )}
                            <div className="menu-divider"></div>
                            <button className="action-menu-item danger" onClick={() => { handleDelete(note._id); setOpenActionsMenu(null); }}>
                              <span>🗑️</span>
                              حذف
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
      )}

      {/* Quick Note Modal */}
      <Modal
        isOpen={showQuickNoteModal}
        onClose={() => setShowQuickNoteModal(false)}
        title={editingQuickNote ? 'تعديل الملاحظة' : 'إضافة ملاحظة سريعة'}
        size="small"
      >
        <div className="quick-note-form">
          <div className="form-group">
            <label>العنوان (اختياري)</label>
            <input
              type="text"
              value={quickNoteData.title}
              onChange={(e) => setQuickNoteData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="عنوان الملاحظة"
            />
          </div>
          <div className="form-group">
            <label>المحتوى *</label>
            <textarea
              value={quickNoteData.content}
              onChange={(e) => setQuickNoteData(prev => ({ ...prev, content: e.target.value }))}
              rows="4"
              placeholder="اكتب ملاحظتك هنا..."
              required
            />
          </div>
          <div className="form-group">
            <label>اللون</label>
            <div className="color-picker">
              {noteColors.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-btn ${quickNoteData.color === c.value ? 'active' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setQuickNoteData(prev => ({ ...prev, color: c.value }))}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setShowQuickNoteModal(false)}>
              إلغاء
            </button>
            <button className="btn btn-primary" onClick={handleSaveQuickNote}>
              {editingQuickNote ? 'حفظ التغييرات' : 'إضافة'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingNote ? 'تعديل المسودة' : 'إضافة مسودة جديدة'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="note-form">
          <div className="form-row">
            <div className="form-group">
              <label>اسم العميل *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>رقم الجوال</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                dir="ltr"
              />
            </div>
          </div>

          <div className="form-group">
            <label>العنوان</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="عنوان مختصر للمسودة"
            />
          </div>

          <div className="form-group">
            <label>الملاحظات</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
              placeholder="تفاصيل إضافية..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>النوع</label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
              >
                <option value="private">خاص (لي فقط)</option>
                <option value="public">عام (للجميع)</option>
              </select>
            </div>
            <div className="form-group">
              <label>الأولوية</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">عالي</option>
              </select>
            </div>
          </div>

          {/* نوع التذكير */}
          <div className="form-group">
            <label>نوع التذكير</label>
            <div className="reminder-type-selector">
              {REMINDER_TYPES.map(rt => (
                <button
                  key={rt.value}
                  type="button"
                  className={`reminder-type-btn ${formData.reminderType === rt.value ? 'active' : ''}`}
                  style={formData.reminderType === rt.value ? { borderColor: rt.color, background: rt.color + '15' } : {}}
                  onClick={() => setFormData(prev => ({ ...prev, reminderType: rt.value }))}
                >
                  <span className="reminder-type-icon">{rt.icon}</span>
                  <span className="reminder-type-label">{rt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.reminderEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
              />
              تفعيل التذكير
            </label>
          </div>

          {formData.reminderEnabled && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>تاريخ التذكير</label>
                  <input
                    type="date"
                    value={formData.reminderDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminderDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>وقت التذكير</label>
                  <select
                    value={formData.reminderTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
                  >
                    {REMINDER_TIME_OPTIONS.map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.emailNotification}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailNotification: e.target.checked }))}
                  />
                  📧 إرسال تنبيه بالبريد الإلكتروني
                </label>
              </div>
            </>
          )}

          {/* المهام الفرعية */}
          <div className="form-group">
            <label>المهام الفرعية (اختياري)</label>
            <div className="subtasks-list">
              {(formData.subTasks || []).map((task, idx) => (
                <div key={idx} className="subtask-row">
                  <input
                    type="checkbox"
                    checked={!!task.completed}
                    onChange={(e) => {
                      const newTasks = [...formData.subTasks];
                      newTasks[idx] = { ...newTasks[idx], completed: e.target.checked };
                      setFormData(prev => ({ ...prev, subTasks: newTasks }));
                    }}
                  />
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => {
                      const newTasks = [...formData.subTasks];
                      newTasks[idx] = { ...newTasks[idx], title: e.target.value };
                      setFormData(prev => ({ ...prev, subTasks: newTasks }));
                    }}
                    placeholder="عنوان المهمة"
                    className={`subtask-input ${task.completed ? 'completed' : ''}`}
                  />
                  <button
                    type="button"
                    className="subtask-remove"
                    onClick={() => {
                      const newTasks = formData.subTasks.filter((_, i) => i !== idx);
                      setFormData(prev => ({ ...prev, subTasks: newTasks }));
                    }}
                    aria-label="حذف"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="subtask-add-btn"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  subTasks: [...(prev.subTasks || []), { title: '', completed: false }]
                }))}
              >
                + إضافة مهمة
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>القسم (اختياري)</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            >
              <option value="">اختر القسم</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.title}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'جاري الحفظ...' : (editingNote ? 'حفظ التغييرات' : 'إضافة')}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingNote(null); }}
        title="تفاصيل المسودة"
        size="medium"
      >
        {viewingNote && (
          <div className="note-details">
            <div className="detail-row">
              <span className="detail-label">العميل:</span>
              <span className="detail-value">{viewingNote.customerName}</span>
            </div>
            {viewingNote.phone && (
              <div className="detail-row">
                <span className="detail-label">الجوال:</span>
                <span className="detail-value" dir="ltr">{viewingNote.phone}</span>
              </div>
            )}
            {viewingNote.title && (
              <div className="detail-row">
                <span className="detail-label">العنوان:</span>
                <span className="detail-value">{viewingNote.title}</span>
              </div>
            )}
            {viewingNote.notes && (
              <div className="detail-row">
                <span className="detail-label">الملاحظات:</span>
                <span className="detail-value notes-text">{viewingNote.notes}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">النوع:</span>
              <span className={`visibility-badge ${getVisibilityBadge(viewingNote.visibility).class}`}>
                {getVisibilityBadge(viewingNote.visibility).icon} {getVisibilityBadge(viewingNote.visibility).label}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">الأولوية:</span>
              <span className={`priority-badge ${getPriorityBadge(viewingNote.priority).class}`}>
                {getPriorityBadge(viewingNote.priority).label}
              </span>
            </div>
            {viewingNote.reminderEnabled && viewingNote.reminderDate && (
              <div className="detail-row">
                <span className="detail-label">التذكير:</span>
                <span className="detail-value">
                  {formatDateDisplay(viewingNote.reminderDate)} - {formatTimeDisplay(viewingNote.reminderTime)}
                </span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">الحالة:</span>
              <span className={`status-badge ${getStatusBadge(viewingNote.status).class}`}>
                {getStatusBadge(viewingNote.status).icon} {getStatusBadge(viewingNote.status).label}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">مضاف بواسطة:</span>
              <span className="detail-value">{viewingNote.createdBy?.name || '-'}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Convert Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => { setShowConvertModal(false); setConvertingNote(null); }}
        title="تحويل لموعد"
        size="small"
      >
        {convertingNote && (
          <div className="convert-form">
            <div className="convert-info">
              <p><strong>العميل:</strong> {convertingNote.customerName}</p>
            </div>

            <div className="form-group">
              <label>نوع الموعد</label>
              <select
                value={convertData.type}
                onChange={(e) => setConvertData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="confirmed">موعد مؤكد</option>
                <option value="unconfirmed">موعد غير مؤكد</option>
              </select>
            </div>

            <div className="form-group">
              <label>القسم *</label>
              <select
                value={convertData.department}
                onChange={(e) => setConvertData(prev => ({ ...prev, department: e.target.value }))}
                required
              >
                <option value="">اختر القسم</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.title}</option>
                ))}
              </select>
            </div>

            {convertData.type === 'confirmed' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>التاريخ *</label>
                    <input
                      type="date"
                      value={convertData.appointmentDate}
                      onChange={(e) => setConvertData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>الوقت</label>
                    <select
                      value={convertData.appointmentTime}
                      onChange={(e) => setConvertData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                    >
                      {hourSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="form-row">
                <div className="form-group">
                  <label>من *</label>
                  <input
                    type="date"
                    value={convertData.dateFrom}
                    onChange={(e) => setConvertData(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>إلى *</label>
                  <input
                    type="date"
                    value={convertData.dateTo}
                    onChange={(e) => setConvertData(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowConvertModal(false)}>
                إلغاء
              </button>
              <button className="btn btn-primary" onClick={handleConvertToAppointment} disabled={saving}>
                {saving ? 'جاري التحويل...' : 'تحويل للموعد'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Notes;
