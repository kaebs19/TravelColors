import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentsApi, departmentsApi, settingsApi } from '../../api';
import { Card, Loader, Modal } from '../../components/common';
import { generateAppointmentReceipt, shareReceiptToWhatsApp } from '../../utils/receiptGenerator';
import './Appointments.css';

const Appointments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlDepartment = searchParams.get('department') || '';

  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState(urlDepartment);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSubmission, setFilterSubmission] = useState(''); // '', 'true', 'false'
  const [filterPeriod, setFilterPeriod] = useState(''); // today, tomorrow, month
  const [viewAppointment, setViewAppointment] = useState(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [openActionsMenu, setOpenActionsMenu] = useState(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table, grid, or calendar
  const [calendarDate, setCalendarDate] = useState(new Date());
  const typeMenuRef = useRef(null);
  const actionsMenuRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // حالة تحويل الموعد غير المؤكد إلى مؤكد
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingAppointment, setConvertingAppointment] = useState(null);
  const [convertData, setConvertData] = useState({
    appointmentDate: '',
    appointmentTime: '08:00',
    duration: 5
  });
  const [converting, setConverting] = useState(false);

  // استخراج قائمة المدن الفريدة
  const uniqueCities = [...new Set(appointments.map(a => a.city).filter(Boolean))];

  // إعدادات الأعمدة الظاهرة
  const [tableColumns, setTableColumns] = useState({
    type: true,
    customerName: true,
    phone: true,
    personsCount: true,
    department: true,
    city: true,
    date: true,
    time: true,
    notes: true,
    status: true,
    createdBy: true,
    isSubmission: true
  });
  const [companySettings, setCompanySettings] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  // إغلاق القوائم عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target)) {
        setShowTypeMenu(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setOpenActionsMenu(null);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setOpenStatusDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, departmentsRes, statsRes, settingsRes] = await Promise.all([
        appointmentsApi.getAppointments(),
        departmentsApi.getDepartments(),
        appointmentsApi.getStats(),
        settingsApi.getSettings()
      ]);

      const appts = appointmentsRes.data?.data?.appointments || appointmentsRes.data?.appointments || [];
      const depts = departmentsRes.data?.data?.departments || departmentsRes.data?.departments || [];
      const statsData = statsRes.data?.data || statsRes.data || {};
      const settingsData = settingsRes.data?.data || {};

      setAppointments(appts);
      setDepartments(depts);
      setStats(statsData);
      setCompanySettings(settingsData);

      // تحميل إعدادات الأعمدة
      if (settingsData.appointmentsTableColumns) {
        setTableColumns(settingsData.appointmentsTableColumns);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setShowTypeMenu(!showTypeMenu);
  };

  const handleTypeSelect = (type) => {
    setShowTypeMenu(false);
    navigate(`/control/appointments/add?type=${type}`);
  };

  const handleEdit = (appointment) => {
    navigate(`/control/appointments/add?type=${appointment.type}&edit=${appointment._id}`);
  };

  const handleView = (appointment) => {
    setViewAppointment(appointment);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
      try {
        await appointmentsApi.deleteAppointment(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await appointmentsApi.changeStatus(id, status);
      fetchData();
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  // فتح نافذة تحويل الموعد غير المؤكد إلى مؤكد
  const handleOpenConvertModal = (appointment) => {
    setConvertingAppointment(appointment);
    // تعيين التاريخ الافتراضي من نطاق التاريخ
    const defaultDate = appointment.dateFrom
      ? new Date(appointment.dateFrom).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setConvertData({
      appointmentDate: defaultDate,
      appointmentTime: '08:00',
      duration: 5
    });
    setShowConvertModal(true);
    setOpenActionsMenu(null);
  };

  // تحويل الموعد غير المؤكد إلى مؤكد
  const handleConvertToConfirmed = async () => {
    if (!convertData.appointmentDate || !convertData.appointmentTime) {
      alert('يرجى تحديد التاريخ والوقت');
      return;
    }

    // التحقق من أن اليوم ليس جمعة أو سبت
    const selectedDate = new Date(convertData.appointmentDate);
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      alert('لا يمكن اختيار يوم الجمعة أو السبت');
      return;
    }

    setConverting(true);
    try {
      await appointmentsApi.updateAppointment(convertingAppointment._id, {
        type: 'confirmed',
        appointmentDate: convertData.appointmentDate,
        appointmentTime: convertData.appointmentTime,
        duration: convertData.duration
      });
      setShowConvertModal(false);
      setConvertingAppointment(null);
      fetchData();
    } catch (error) {
      console.error('Error converting appointment:', error);
      alert('حدث خطأ أثناء تحويل الموعد');
    } finally {
      setConverting(false);
    }
  };

  // توليد ساعات العمل
  const generateHourSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 14; hour++) {
      const h = hour.toString().padStart(2, '0');
      const period = hour < 12 ? 'ص' : 'م';
      const displayHour = hour > 12 ? hour - 12 : hour;
      slots.push({ value: `${h}:00`, label: `${displayHour} ${period}` });
    }
    return slots;
  };

  const hourSlots = generateHourSlots();
  const durationOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // دالة للتحقق من الفترة الزمنية
  const isInPeriod = (appt, period) => {
    if (!period) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const apptDate = appt.appointmentDate ? new Date(appt.appointmentDate) : null;
    const dateFrom = appt.dateFrom ? new Date(appt.dateFrom) : null;
    const dateTo = appt.dateTo ? new Date(appt.dateTo) : null;
    const reminderDate = appt.reminderDate ? new Date(appt.reminderDate) : null;

    if (period === 'today') {
      if (apptDate) return apptDate >= today && apptDate < tomorrow;
      if (dateFrom && dateTo) return dateFrom <= tomorrow && dateTo >= today;
      if (reminderDate) return reminderDate >= today && reminderDate < tomorrow;
      return false;
    }

    if (period === 'tomorrow') {
      if (apptDate) return apptDate >= tomorrow && apptDate < dayAfterTomorrow;
      if (dateFrom && dateTo) return dateFrom <= dayAfterTomorrow && dateTo >= tomorrow;
      if (reminderDate) return reminderDate >= tomorrow && reminderDate < dayAfterTomorrow;
      return false;
    }

    if (period === 'month') {
      if (apptDate) return apptDate >= monthStart && apptDate <= monthEnd;
      if (dateFrom && dateTo) return dateFrom <= monthEnd && dateTo >= monthStart;
      if (reminderDate) return reminderDate >= monthStart && reminderDate <= monthEnd;
      return false;
    }

    return true;
  };

  const filteredAppointments = appointments.filter(appt => {
    const matchesSearch = !search ||
      appt.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      appt.phone?.includes(search);

    const matchesDepartment = !filterDepartment || appt.department?._id === filterDepartment;
    const matchesStatus = !filterStatus || appt.status === filterStatus;
    const matchesType = !filterType || appt.type === filterType;
    const matchesCity = !filterCity || appt.city === filterCity;
    const matchesSubmission = !filterSubmission ||
      (filterSubmission === 'true' ? appt.isSubmission === true : appt.isSubmission !== true);
    const matchesPeriod = isInPeriod(appt, filterPeriod);

    let matchesDate = true;
    if (filterDate) {
      const filterDateObj = new Date(filterDate).toDateString();
      if (appt.appointmentDate) {
        const apptDate = new Date(appt.appointmentDate).toDateString();
        matchesDate = apptDate === filterDateObj;
      } else if (appt.dateFrom && appt.dateTo) {
        const from = new Date(appt.dateFrom);
        const to = new Date(appt.dateTo);
        const filter = new Date(filterDate);
        matchesDate = filter >= from && filter <= to;
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDepartment && matchesStatus && matchesType && matchesDate && matchesCity && matchesSubmission && matchesPeriod;
  });

  // حساب إجمالي الأشخاص في المواعيد المفلترة
  const totalFilteredPersons = filteredAppointments.reduce((sum, a) => sum + (a.personsCount || 1), 0);

  // دالة ضغط البطاقة
  const handleStatCardClick = (period) => {
    if (filterPeriod === period) {
      setFilterPeriod('');
    } else {
      setFilterPeriod(period);
      setFilterDate('');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      new: { label: 'جديد', class: 'status-new', icon: '🆕' },
      in_progress: { label: 'قيد العمل', class: 'status-in-progress', icon: '🔄' },
      completed: { label: 'مكتمل', class: 'status-completed', icon: '✔️' },
      cancelled: { label: 'ملغي', class: 'status-cancelled', icon: '❌' }
    };
    return statusMap[status] || { label: 'جديد', class: 'status-new', icon: '🆕' };
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      confirmed: { label: 'مؤكد', class: 'type-confirmed' },
      unconfirmed: { label: 'غير مؤكد', class: 'type-unconfirmed' },
      draft: { label: 'مسودة', class: 'type-draft' }
    };
    return typeMap[type] || { label: type, class: '' };
  };

  const formatDateDisplay = (dateStr, includeYear = false) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (includeYear) {
      return `${days[date.getDay()]} / ${day}/${month}/${year}`;
    }
    return `${days[date.getDay()]} / ${day}/${month}`;
  };

  // دالة إرسال رسالة واتساب
  const handleSendWhatsApp = (appointment) => {
    const dept = departments.find(d => d._id === appointment.department?._id);
    const deptTitle = dept?.title || appointment.department?.title || '';
    let message = '';

    if (appointment.type === 'confirmed') {
      const date = new Date(appointment.appointmentDate);
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const dayName = days[date.getDay()];
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      const timeParts = appointment.appointmentTime?.split(':') || ['00', '00'];
      const hour = parseInt(timeParts[0]);
      const period = hour < 12 ? 'صباحاً' : 'مساءً';
      const displayHour = hour > 12 ? hour - 12 : hour;
      const timeDisplay = `${displayHour}:${timeParts[1]} ${period}`;

      message = `عزيزي العميل: ${appointment.customerName} 🤝

نؤكد لك حجز موعدك لدى: ${deptTitle}

📅 تفاصيل الموعد:
- التاريخ: ${dayName} ${formattedDate}
- الوقت: ${timeDisplay}
- عدد الأشخاص: ${appointment.personsCount}

⏰ الرجاء الحضور قبل الموعد بـ 15 دقيقة.

مع أطيب التحيات،
ألوان المسافر للسفر والسياحة 🌍`;
    } else {
      const dateFrom = new Date(appointment.dateFrom);
      const dateTo = new Date(appointment.dateTo);
      const formattedFrom = `${dateFrom.getDate()}/${dateFrom.getMonth() + 1}/${dateFrom.getFullYear()}`;
      const formattedTo = `${dateTo.getDate()}/${dateTo.getMonth() + 1}/${dateTo.getFullYear()}`;

      message = `عزيزي العميل: ${appointment.customerName} 🤝

تم تسجيل طلب موعدك لدى: ${deptTitle}

📅 الفترة المتوقعة للموعد:
- من: ${formattedFrom}
- إلى: ${formattedTo}
- عدد الأشخاص: ${appointment.personsCount}

📌 ملاحظة مهمة:
هذا الموعد قيد التأكيد، وسنوافيك بالتاريخ والوقت المحدد فور تأكيده.

مع أطيب التحيات،
ألوان المسافر للسفر والسياحة 🌍`;
    }

    const phone = appointment.phone?.replace(/[^0-9]/g, '');
    const phoneNumber = phone?.startsWith('0') ? '966' + phone.slice(1) : phone;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = phoneNumber
      ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setOpenActionsMenu(null);
  };

  // دالة إضافة كعميل
  const handleAddAsCustomer = (appointment) => {
    navigate(`/control/customers/add?name=${encodeURIComponent(appointment.customerName)}&phone=${encodeURIComponent(appointment.phone || '')}`);
    setOpenActionsMenu(null);
  };

  // دالة طباعة الإيصال
  const handlePrintReceipt = async (appointment) => {
    try {
      const dept = departments.find(d => d._id === appointment.department?._id);
      const logoUrl = companySettings.logo
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}${companySettings.logo}`
        : '/logo512.png';
      await generateAppointmentReceipt(appointment, {
        departmentTitle: dept?.title || appointment.department?.title || 'غير محدد',
        employeeName: appointment.createdBy?.name || 'موظف النظام',
        logoUrl,
        companyName: companySettings.companyName || 'ألوان المسافر',
        companyNameEn: companySettings.companyNameEn || 'Travel Colors',
        companyPhone: companySettings.phone || '0558741741',
        companyEmail: companySettings.email || 'info@trcolors.com',
        companyAddress: companySettings.address ? companySettings.address.split('\n')[0] : 'الرياض - حي الصحافة',
        receiptSettings: companySettings.receiptSettings || {},
        receiptTerms: companySettings.receiptTerms || ''
      });
      setOpenActionsMenu(null);
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('حدث خطأ أثناء إنشاء الإيصال');
    }
  };

  // دالة إرسال الإيصال للواتساب
  const handleShareReceiptWhatsApp = async (appointment) => {
    try {
      const dept = departments.find(d => d._id === appointment.department?._id);
      const logoUrl = companySettings.logo
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}${companySettings.logo}`
        : '/logo512.png';
      const result = await shareReceiptToWhatsApp(appointment, {
        departmentTitle: dept?.title || appointment.department?.title || 'غير محدد',
        employeeName: appointment.createdBy?.name || 'موظف النظام',
        logoUrl,
        companyName: companySettings.companyName || 'ألوان المسافر',
        companyNameEn: companySettings.companyNameEn || 'Travel Colors',
        companyPhone: companySettings.phone || '0558741741',
        companyEmail: companySettings.email || 'info@trcolors.com',
        companyAddress: companySettings.address ? companySettings.address.split('\n')[0] : 'الرياض - حي الصحافة',
        receiptSettings: companySettings.receiptSettings || {},
        receiptTerms: companySettings.receiptTerms || ''
      });
      setOpenActionsMenu(null);
      if (result.message) {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      alert('حدث خطأ أثناء مشاركة الإيصال');
    }
  };

  const formatTimeDisplay = (time) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h < 12 ? 'ص' : 'م';
    const displayHour = h > 12 ? h - 12 : h;
    return `${displayHour}:${minutes} ${period}`;
  };

  // دوال التقويم
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // أيام فارغة في بداية الشهر
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, date: null });
    }

    // أيام الشهر
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, date });
    }

    return days;
  };

  const getAppointmentsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toDateString();

    return filteredAppointments.filter(appt => {
      if (appt.type === 'confirmed' && appt.appointmentDate) {
        return new Date(appt.appointmentDate).toDateString() === dateStr;
      }
      if (appt.type === 'unconfirmed' && appt.dateFrom && appt.dateTo) {
        const from = new Date(appt.dateFrom);
        const to = new Date(appt.dateTo);
        return date >= from && date <= to;
      }
      if (appt.type === 'draft' && appt.reminderDate) {
        return new Date(appt.reminderDate).toDateString() === dateStr;
      }
      return false;
    });
  };

  const handleCalendarPrev = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleCalendarNext = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const handleCalendarToday = () => {
    setCalendarDate(new Date());
  };

  const handleDayClick = (date) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      setFilterDate(dateStr);
      setViewMode('table');
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isWeekend = (date) => {
    if (!date) return false;
    const day = date.getDay();
    return day === 5 || day === 6; // الجمعة والسبت
  };


  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="appointments-page">
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <span>لوحة التحكم</span>
        <span className="separator">/</span>
        <span className="current">إدارة المواعيد</span>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid stats-grid-6">
        <div
          className={`stat-card stat-total clickable ${filterPeriod === '' && !filterStatus ? 'active' : ''}`}
          onClick={() => { setFilterPeriod(''); setFilterStatus(''); }}
        >
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total || 0}</span>
            <span className="stat-label">إجمالي المواعيد</span>
          </div>
        </div>
        <div
          className={`stat-card stat-today clickable ${filterPeriod === 'today' ? 'active' : ''}`}
          onClick={() => handleStatCardClick('today')}
        >
          <div className="stat-icon">📆</div>
          <div className="stat-info">
            <span className="stat-value">{stats.today || 0}</span>
            <span className="stat-label">مواعيد اليوم</span>
            {stats.todayPersons > 0 && <span className="stat-sub">{stats.todayPersons} شخص</span>}
          </div>
        </div>
        <div
          className={`stat-card stat-tomorrow clickable ${filterPeriod === 'tomorrow' ? 'active' : ''}`}
          onClick={() => handleStatCardClick('tomorrow')}
        >
          <div className="stat-icon">🗓️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.tomorrow || 0}</span>
            <span className="stat-label">مواعيد غداً</span>
          </div>
        </div>
        <div
          className={`stat-card stat-month clickable ${filterPeriod === 'month' ? 'active' : ''}`}
          onClick={() => handleStatCardClick('month')}
        >
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">{stats.month || 0}</span>
            <span className="stat-label">هذا الشهر</span>
          </div>
        </div>
        <div
          className={`stat-card stat-new clickable ${filterStatus === 'new' ? 'active' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'new' ? '' : 'new')}
        >
          <div className="stat-icon">🆕</div>
          <div className="stat-info">
            <span className="stat-value">{stats.new || 0}</span>
            <span className="stat-label">جديدة</span>
          </div>
        </div>
        <div
          className={`stat-card stat-persons`}
        >
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalPersons || 0}</span>
            <span className="stat-label">إجمالي الأشخاص</span>
          </div>
        </div>
      </div>

      {/* فلتر نشط */}
      {(filterPeriod || filterStatus) && (
        <div className="active-filter-banner">
          <span>
            {filterPeriod === 'today' && '📆 عرض مواعيد اليوم'}
            {filterPeriod === 'tomorrow' && '🗓️ عرض مواعيد غداً'}
            {filterPeriod === 'month' && '📊 عرض مواعيد الشهر'}
            {filterStatus === 'new' && '🆕 عرض المواعيد الجديدة'}
            {' '} ({filteredAppointments.length} موعد - {totalFilteredPersons} شخص)
          </span>
          <button onClick={() => { setFilterPeriod(''); setFilterStatus(''); }}>إلغاء الفلتر ✕</button>
        </div>
      )}

      {/* Old completed stat - hidden */}
      <div className="hidden-stat" style={{display: 'none'}}>
        <div className="stat-card stat-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.completed || 0}</span>
            <span className="stat-label">مكتملة</span>
          </div>
        </div>
      </div>

      {/* Header with Actions */}
      <div className="page-header">
        <div className="header-right">
          <div className="add-btn-wrapper" ref={typeMenuRef}>
            <button className="add-btn" onClick={handleAddClick}>
              <span>+</span>
              إضافة موعد جديد
              <span className="dropdown-arrow">▼</span>
            </button>
            {showTypeMenu && (
              <div className="type-dropdown-menu">
                <button className="type-menu-item confirmed" onClick={() => handleTypeSelect('confirmed')}>
                  <span className="menu-icon">✓</span>
                  <div className="menu-text">
                    <span className="menu-title">موعد مؤكد</span>
                    <span className="menu-desc">تاريخ ووقت محدد</span>
                  </div>
                </button>
                <button className="type-menu-item unconfirmed" onClick={() => handleTypeSelect('unconfirmed')}>
                  <span className="menu-icon">○</span>
                  <div className="menu-text">
                    <span className="menu-title">موعد غير مؤكد</span>
                    <span className="menu-desc">نطاق تاريخ متوقع</span>
                  </div>
                </button>
                <button className="type-menu-item draft" onClick={() => handleTypeSelect('draft')}>
                  <span className="menu-icon">📝</span>
                  <div className="menu-text">
                    <span className="menu-title">مسودة</span>
                    <span className="menu-desc">حفظ مع تذكير</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="header-left">
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">جميع الأنواع</option>
            <option value="confirmed">مؤكد</option>
            <option value="unconfirmed">غير مؤكد</option>
            <option value="draft">مسودة</option>
          </select>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">جميع الحالات</option>
            <option value="new">جديد</option>
            <option value="in_progress">قيد العمل</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
          <select
            className="filter-select"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="">جميع الأقسام</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.title}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">جميع المدن</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterSubmission}
            onChange={(e) => setFilterSubmission(e.target.value)}
          >
            <option value="">الكل</option>
            <option value="true">تقديم ✓</option>
            <option value="false">بدون تقديم</option>
          </select>
          <input
            type="date"
            className="filter-date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="عرض جدول"
            >
              ☰
            </button>
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="عرض شبكة"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="عرض التقويم"
            >
              📅
            </button>
          </div>
        </div>
      </div>

      {/* Appointments View */}
      {viewMode === 'calendar' ? (
        <Card className="calendar-card">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button className="calendar-nav-btn" onClick={handleCalendarPrev}>◀</button>
              <button className="calendar-today-btn" onClick={handleCalendarToday}>اليوم</button>
              <button className="calendar-nav-btn" onClick={handleCalendarNext}>▶</button>
            </div>
            <h2 className="calendar-title">
              {arabicMonths[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </h2>
          </div>
          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {arabicDays.map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {getCalendarDays().map((item, index) => {
                const dayAppointments = getAppointmentsForDate(item.date);
                const hasAppointments = dayAppointments.length > 0;
                const totalPersons = dayAppointments.reduce((sum, a) => sum + (a.personsCount || 1), 0);

                return (
                  <div
                    key={index}
                    className={`calendar-day ${!item.day ? 'empty' : ''} ${isToday(item.date) ? 'today' : ''} ${isWeekend(item.date) ? 'weekend' : ''} ${hasAppointments ? 'has-appointments' : ''}`}
                    onClick={() => item.day && handleDayClick(item.date)}
                  >
                    {item.day && (
                      <>
                        <span className="day-number">{item.day}</span>
                        {hasAppointments && (
                          <div className="day-appointments">
                            <span className="appt-count">{dayAppointments.length}</span>
                            <span className="person-count">{totalPersons}👥</span>
                            <div className="appt-types">
                              {dayAppointments.slice(0, 3).map((appt, i) => (
                                <span
                                  key={i}
                                  className={`appt-dot type-${appt.type}`}
                                  title={appt.customerName}
                                ></span>
                              ))}
                              {dayAppointments.length > 3 && <span className="more-dots">+{dayAppointments.length - 3}</span>}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="calendar-legend">
            <div className="legend-item"><span className="legend-dot type-confirmed"></span> مؤكد</div>
            <div className="legend-item"><span className="legend-dot type-unconfirmed"></span> غير مؤكد</div>
            <div className="legend-item"><span className="legend-dot type-draft"></span> مسودة</div>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="appointments-grid">
          {filteredAppointments.length === 0 ? (
            <div className="empty-grid">لا توجد مواعيد</div>
          ) : (
            filteredAppointments.map(appointment => {
              const statusInfo = getStatusBadge(appointment.status);
              const typeInfo = getTypeBadge(appointment.type);

              let dateDisplay = '-';
              if (appointment.type === 'confirmed') {
                dateDisplay = formatDateDisplay(appointment.appointmentDate, true);
              } else if (appointment.type === 'unconfirmed') {
                dateDisplay = `${formatDateDisplay(appointment.dateFrom)} - ${formatDateDisplay(appointment.dateTo)}`;
              } else if (appointment.type === 'draft') {
                dateDisplay = formatDateDisplay(appointment.reminderDate, true);
              }

              return (
                <div key={appointment._id} className="appointment-card">
                  <div className="card-header">
                    <span className={`type-badge ${typeInfo.class}`}>{typeInfo.label}</span>
                    <span className={`status-badge ${statusInfo.class}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                  <div className="card-body">
                    <h4 className="card-customer">
                      {appointment.isVIP && <span className="vip-star">⭐</span>}
                      {appointment.customer ? (
                        <button
                          className="customer-link"
                          onClick={() => navigate(`/control/customers/${appointment.customer._id}`)}
                        >
                          {appointment.customerName}
                        </button>
                      ) : (
                        appointment.customerName
                      )}
                    </h4>
                    {appointment.phone && (
                      <p className="card-phone" dir="ltr">{appointment.phone}</p>
                    )}
                    <div className="card-info">
                      <span>📅 {dateDisplay}</span>
                      {appointment.type === 'confirmed' && appointment.appointmentTime && (
                        <span>🕐 {formatTimeDisplay(appointment.appointmentTime)}</span>
                      )}
                      <span>👥 {appointment.personsCount || 1} شخص</span>
                    </div>
                    {appointment.department && (
                      <p className="card-dept">🏢 {appointment.department.title}</p>
                    )}
                  </div>
                  <div className="card-actions">
                    <button className="card-action-btn view" onClick={() => handleView(appointment)} title="تفاصيل">👁️</button>
                    <button className="card-action-btn edit" onClick={() => handleEdit(appointment)} title="تعديل">✏️</button>
                    <button className="card-action-btn whatsapp" onClick={() => handleSendWhatsApp(appointment)} title="واتساب">📱</button>
                    <button className="card-action-btn receipt" onClick={() => handlePrintReceipt(appointment)} title="إيصال">🧾</button>
                    {appointment.type === 'unconfirmed' && (
                      <button className="card-action-btn convert" onClick={() => handleOpenConvertModal(appointment)} title="تحويل">🔄</button>
                    )}
                    <button className="card-action-btn delete" onClick={() => handleDelete(appointment._id)} title="حذف">🗑️</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
      <Card className="table-card">
        <table className="appointments-table">
          <thead>
            <tr>
              {tableColumns.type !== false && <th>النوع</th>}
              {tableColumns.customerName !== false && <th>العميل</th>}
              {tableColumns.phone !== false && <th>رقم الجوال</th>}
              {tableColumns.personsCount !== false && <th>العدد</th>}
              {tableColumns.department !== false && <th>القسم</th>}
              {tableColumns.city !== false && <th>المدينة</th>}
              {tableColumns.date !== false && <th>التاريخ</th>}
              {tableColumns.time !== false && <th>الوقت</th>}
              {tableColumns.notes !== false && <th>ملاحظات</th>}
              {tableColumns.status !== false && <th>الحالة</th>}
              {tableColumns.createdBy !== false && <th>مضاف بواسطة</th>}
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="20" className="empty-row">
                  لا توجد مواعيد
                </td>
              </tr>
            ) : (
              filteredAppointments.map(appointment => {
                const statusInfo = getStatusBadge(appointment.status);
                const typeInfo = getTypeBadge(appointment.type);

                // عرض التاريخ حسب نوع الموعد
                let dateDisplay = '-';
                let timeDisplay = '-';

                if (appointment.type === 'confirmed') {
                  dateDisplay = formatDateDisplay(appointment.appointmentDate, true);
                  timeDisplay = formatTimeDisplay(appointment.appointmentTime);
                } else if (appointment.type === 'unconfirmed') {
                  dateDisplay = `${formatDateDisplay(appointment.dateFrom, true)} - ${formatDateDisplay(appointment.dateTo, true)}`;
                  timeDisplay = '-';
                } else if (appointment.type === 'draft') {
                  dateDisplay = formatDateDisplay(appointment.reminderDate, true);
                  timeDisplay = formatTimeDisplay(appointment.reminderTime);
                }

                return (
                  <tr key={appointment._id}>
                    {tableColumns.type !== false && (
                      <td>
                        <span className={`type-badge ${typeInfo.class}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                    )}
                    {tableColumns.customerName !== false && (
                      <td className="customer-name">
                        <div className="customer-info-wrapper">
                          {appointment.customer ? (
                            <button
                              className="customer-link"
                              onClick={() => navigate(`/control/customers/${appointment.customer._id}`)}
                            >
                              {appointment.isVIP && <span className="vip-star">⭐</span>}
                              {appointment.customerName}
                              {appointment.isSubmission && <span className="submission-badge">📤</span>}
                            </button>
                          ) : (
                            <span className="customer-text">
                              {appointment.isVIP && <span className="vip-star">⭐</span>}
                              {appointment.customerName}
                              {appointment.isSubmission && <span className="submission-badge">📤</span>}
                            </span>
                          )}
                          <div className="customer-hover-card">
                            <div className="hover-card-header">
                              <span className="hover-card-avatar">
                                {appointment.customerName?.charAt(0)}
                              </span>
                              <div className="hover-card-name">
                                {appointment.isVIP && <span className="vip-badge-small">⭐ VIP</span>}
                                <strong>{appointment.customerName}</strong>
                              </div>
                            </div>
                            <div className="hover-card-details">
                              {appointment.phone && (
                                <div className="hover-detail">
                                  <span className="hover-icon">📱</span>
                                  <span dir="ltr">{appointment.phone}</span>
                                </div>
                              )}
                              {appointment.customer?.email && (
                                <div className="hover-detail">
                                  <span className="hover-icon">📧</span>
                                  <span>{appointment.customer.email}</span>
                                </div>
                              )}
                              <div className="hover-detail">
                                <span className="hover-icon">👥</span>
                                <span>{appointment.personsCount} شخص</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {tableColumns.phone !== false && <td dir="ltr">{appointment.phone || '-'}</td>}
                    {tableColumns.personsCount !== false && (
                      <td>
                        <span className="persons-count-badge">
                          {appointment.personsCount || 1}
                        </span>
                      </td>
                    )}
                    {tableColumns.department !== false && (
                      <td>
                        {appointment.department ? (
                          <button
                            className="dept-link"
                            onClick={() => setFilterDepartment(appointment.department._id)}
                          >
                            {appointment.department.title}
                          </button>
                        ) : '-'}
                      </td>
                    )}
                    {tableColumns.city !== false && <td>{appointment.city || '-'}</td>}
                    {tableColumns.date !== false && <td>{dateDisplay}</td>}
                    {tableColumns.time !== false && <td dir="ltr">{timeDisplay}</td>}
                    {tableColumns.notes !== false && (
                      <td>
                        {appointment.notes ? (
                          <span className="notes-preview" title={appointment.notes}>
                            {appointment.notes.length > 20 ? appointment.notes.substring(0, 20) + '...' : appointment.notes}
                          </span>
                        ) : '-'}
                      </td>
                    )}
                    {tableColumns.status !== false && (
                      <td>
                        <div className="status-dropdown-wrapper" ref={openStatusDropdown === appointment._id ? statusDropdownRef : null}>
                          <span
                            className={`status-badge clickable ${statusInfo.class}`}
                            onClick={() => setOpenStatusDropdown(openStatusDropdown === appointment._id ? null : appointment._id)}
                          >
                            {statusInfo.label} <span className="status-arrow">▾</span>
                          </span>
                          {openStatusDropdown === appointment._id && (
                            <div className="status-dropdown-menu">
                              {[
                                { id: 'new', label: 'جديد', icon: '🆕', class: 'status-new' },
                                { id: 'in_progress', label: 'قيد العمل', icon: '🔄', class: 'status-in-progress' },
                                { id: 'completed', label: 'مكتمل', icon: '✔️', class: 'status-completed' },
                                { id: 'cancelled', label: 'ملغي', icon: '❌', class: 'status-cancelled' }
                              ].map(s => (
                                <button
                                  key={s.id}
                                  className={`status-option ${s.class} ${appointment.status === s.id ? 'active' : ''}`}
                                  onClick={() => {
                                    if (appointment.status !== s.id) {
                                      handleStatusChange(appointment._id, s.id);
                                    }
                                    setOpenStatusDropdown(null);
                                  }}
                                >
                                  <span className="status-option-icon">{s.icon}</span>
                                  <span>{s.label}</span>
                                  {appointment.status === s.id && <span className="status-check">✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {tableColumns.createdBy !== false && (
                      <td>
                        <span className="created-by-cell">
                          {appointment.createdBy?.name || '-'}
                        </span>
                      </td>
                    )}
                    <td className="actions-cell">
                      <div className="actions-dropdown-wrapper" ref={openActionsMenu === appointment._id ? actionsMenuRef : null}>
                        <button
                          className="actions-menu-btn"
                          onClick={() => setOpenActionsMenu(openActionsMenu === appointment._id ? null : appointment._id)}
                        >
                          ⋮
                        </button>
                        {openActionsMenu === appointment._id && (
                          <div className="actions-dropdown-menu">
                            <button className="action-menu-item" onClick={() => { handleView(appointment); setOpenActionsMenu(null); }}>
                              <span>👁️</span>
                              تفاصيل الموعد
                            </button>
                            <button className="action-menu-item" onClick={() => { handleEdit(appointment); setOpenActionsMenu(null); }}>
                              <span>✏️</span>
                              تعديل الموعد
                            </button>
                            {!appointment.customer && (
                              <button className="action-menu-item" onClick={() => handleAddAsCustomer(appointment)}>
                                <span>👤</span>
                                إضافة كعميل
                              </button>
                            )}
                            <button className="action-menu-item" onClick={() => handleSendWhatsApp(appointment)}>
                              <span>📱</span>
                              رسالة تأكيد موعد
                            </button>
                            <button className="action-menu-item" onClick={() => handlePrintReceipt(appointment)}>
                              <span>🧾</span>
                              طباعة إيصال
                            </button>
                            <button className="action-menu-item" onClick={() => handleShareReceiptWhatsApp(appointment)}>
                              <span>📤</span>
                              إرسال الإيصال للواتساب
                            </button>
                            {appointment.type === 'unconfirmed' && (
                              <button className="action-menu-item convert" onClick={() => handleOpenConvertModal(appointment)}>
                                <span>🔄</span>
                                تحويل لموعد مؤكد
                              </button>
                            )}
                            <div className="menu-divider"></div>
                            <button className="action-menu-item danger" onClick={() => { handleDelete(appointment._id); setOpenActionsMenu(null); }}>
                              <span>🗑️</span>
                              حذف الموعد
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

      {/* View Modal */}
      <Modal
        isOpen={!!viewAppointment}
        onClose={() => setViewAppointment(null)}
        title="تفاصيل الموعد"
        size="medium"
      >
        {viewAppointment && (
          <div className="appointment-details">
            <div className="detail-row">
              <span className="detail-label">نوع الموعد:</span>
              <span className={`type-badge ${getTypeBadge(viewAppointment.type).class}`}>
                {getTypeBadge(viewAppointment.type).label}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">اسم العميل:</span>
              <span className="detail-value">{viewAppointment.customerName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">رقم الجوال:</span>
              <span className="detail-value" dir="ltr">{viewAppointment.phone || '-'}</span>
            </div>
            {viewAppointment.type !== 'draft' && (
              <>
                <div className="detail-row">
                  <span className="detail-label">عدد الأشخاص:</span>
                  <span className="detail-value">{viewAppointment.personsCount}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">القسم:</span>
                  <span className="detail-value">{viewAppointment.department?.title}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">المدينة:</span>
                  <span className="detail-value">{viewAppointment.city}</span>
                </div>
              </>
            )}

            {viewAppointment.type === 'confirmed' && (
              <>
                <div className="detail-row">
                  <span className="detail-label">التاريخ:</span>
                  <span className="detail-value">{formatDateDisplay(viewAppointment.appointmentDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">الوقت:</span>
                  <span className="detail-value" dir="ltr">{formatTimeDisplay(viewAppointment.appointmentTime)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">المدة:</span>
                  <span className="detail-value">{viewAppointment.duration} دقيقة</span>
                </div>
              </>
            )}

            {viewAppointment.type === 'unconfirmed' && (
              <div className="detail-row">
                <span className="detail-label">نطاق التاريخ:</span>
                <span className="detail-value">
                  {formatDateDisplay(viewAppointment.dateFrom)} - {formatDateDisplay(viewAppointment.dateTo)}
                </span>
              </div>
            )}

            {viewAppointment.type === 'draft' && (
              <>
                <div className="detail-row">
                  <span className="detail-label">تاريخ التذكير:</span>
                  <span className="detail-value">{formatDateDisplay(viewAppointment.reminderDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">وقت التذكير:</span>
                  <span className="detail-value" dir="ltr">{formatTimeDisplay(viewAppointment.reminderTime)}</span>
                </div>
              </>
            )}

            {viewAppointment.isSubmission && (
              <div className="detail-row">
                <span className="detail-label">تقديم:</span>
                <span className="detail-value">نعم</span>
              </div>
            )}

            {viewAppointment.notes && (
              <div className="detail-row notes-row">
                <span className="detail-label">ملاحظات:</span>
                <span className="detail-value notes-value">{viewAppointment.notes}</span>
              </div>
            )}

            {viewAppointment.createdBy && (
              <div className="detail-row">
                <span className="detail-label">مضاف بواسطة:</span>
                <span className="detail-value created-by">
                  👤 {viewAppointment.createdBy?.name || 'غير معروف'}
                </span>
              </div>
            )}

            {viewAppointment.attachments && viewAppointment.attachments.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">المرفقات:</span>
                <div className="detail-attachments">
                  {viewAppointment.attachments.map((att, i) => (
                    <span key={i} className="attachment-badge">
                      {att.mimetype?.includes('image') ? '🖼️' : '📄'} {att.originalName || att.filename}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">حالة الموعد:</span>
              <span className={`status-badge ${getStatusBadge(viewAppointment.status).class}`}>
                {getStatusBadge(viewAppointment.status).icon} {getStatusBadge(viewAppointment.status).label}
              </span>
            </div>

            {/* بيانات الدفع */}
            {(viewAppointment.paymentType || viewAppointment.totalAmount > 0) && (
              <>
                <div className="detail-divider">💳 بيانات الدفع</div>
                {viewAppointment.paymentType && (
                  <div className="detail-row">
                    <span className="detail-label">طريقة الدفع:</span>
                    <span className="detail-value">
                      {viewAppointment.paymentType === 'cash' ? 'نقدي' :
                       viewAppointment.paymentType === 'card' ? 'شبكة' :
                       viewAppointment.paymentType === 'transfer' ? 'تحويل' : '-'}
                    </span>
                  </div>
                )}
                {viewAppointment.totalAmount > 0 && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">المبلغ الإجمالي:</span>
                      <span className="detail-value">{viewAppointment.totalAmount} ريال</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">المبلغ المدفوع:</span>
                      <span className="detail-value">{viewAppointment.paidAmount || 0} ريال</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">المبلغ المتبقي:</span>
                      <span className={`detail-value ${viewAppointment.remainingAmount > 0 ? 'remaining-warning' : ''}`}>
                        {viewAppointment.remainingAmount || 0} ريال
                      </span>
                    </div>
                  </>
                )}
              </>
            )}

            {/* أزرار الإجراءات */}
            <div className="modal-actions-row">
              <button
                className="modal-action-btn receipt-btn"
                onClick={() => handlePrintReceipt(viewAppointment)}
              >
                <span>🧾</span>
                طباعة إيصال
              </button>
              <button
                className="modal-action-btn share-btn"
                onClick={() => handleShareReceiptWhatsApp(viewAppointment)}
              >
                <span>📤</span>
                إرسال الإيصال
              </button>
              <button
                className="modal-action-btn whatsapp-btn"
                onClick={() => handleSendWhatsApp(viewAppointment)}
              >
                <span>📱</span>
                رسالة واتساب
              </button>
              <button
                className="modal-action-btn edit-btn"
                onClick={() => { handleEdit(viewAppointment); setViewAppointment(null); }}
              >
                <span>✏️</span>
                تعديل
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Convert to Confirmed Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => { setShowConvertModal(false); setConvertingAppointment(null); }}
        title="تحويل لموعد مؤكد"
        size="small"
      >
        {convertingAppointment && (
          <div className="convert-modal-content">
            <div className="convert-info">
              <p><strong>العميل:</strong> {convertingAppointment.customerName}</p>
              <p><strong>القسم:</strong> {convertingAppointment.department?.title}</p>
              <p><strong>النطاق السابق:</strong> {formatDateDisplay(convertingAppointment.dateFrom, true)} - {formatDateDisplay(convertingAppointment.dateTo, true)}</p>
            </div>

            <div className="convert-form">
              <div className="form-group">
                <label>تاريخ الموعد *</label>
                <input
                  type="date"
                  value={convertData.appointmentDate}
                  onChange={(e) => setConvertData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>الوقت *</label>
                  <select
                    value={convertData.appointmentTime}
                    onChange={(e) => setConvertData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                  >
                    {hourSlots.map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>المدة (دقيقة)</label>
                  <select
                    value={convertData.duration}
                    onChange={(e) => setConvertData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  >
                    {durationOptions.map(d => (
                      <option key={d} value={d}>{d} دقيقة</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="convert-note">
                ⚠️ لا يمكن اختيار يوم الجمعة أو السبت
              </p>

              <div className="modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => { setShowConvertModal(false); setConvertingAppointment(null); }}
                  disabled={converting}
                >
                  إلغاء
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleConvertToConfirmed}
                  disabled={converting}
                >
                  {converting ? 'جاري التحويل...' : 'تأكيد التحويل'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Appointments;
