import { useState, useEffect } from 'react';
import { tasksApi, departmentsApi, employeesApi } from '../../api';
import { Card, Loader, Modal } from '../../components/common';
import './Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // فلاتر
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');

  // Modal تفاصيل المهمة
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Modal تحويل المهمة
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({ toUserId: '', reason: '' });

  // إضافة ملاحظة
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // وضع العرض (شبكة أو قائمة أو كانبان أو تقويم أو تقارير)
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'kanban', 'calendar', 'reports'

  // تقارير
  const [reportType, setReportType] = useState('performance'); // 'performance', 'productivity', 'delays'

  // التقويم
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // فلتر النطاق الزمني
  const [dateRangeFilter, setDateRangeFilter] = useState({
    type: '', // 'tomorrow', 'week', 'month', 'custom'
    startDate: '',
    endDate: ''
  });

  // حالة طي/فتح صفوف البطاقات
  const [collapsedSections, setCollapsedSections] = useState({
    status: false,      // بطاقات الحالة
    time: false,        // بطاقات الفترة الزمنية
    reports: false      // بطاقات التقارير
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, statsRes, deptsRes, empsRes] = await Promise.all([
        tasksApi.getTasks(),
        tasksApi.getStats(),
        departmentsApi.getDepartments(),
        employeesApi.getEmployees()
      ]);

      setTasks(tasksRes.data?.data?.tasks || tasksRes.data?.tasks || []);
      setStats(statsRes.data?.data || statsRes.data || {});
      setDepartments(deptsRes.data?.data?.departments || deptsRes.data?.departments || []);
      setEmployees(empsRes.data?.data?.employees || empsRes.data?.employees || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = async (task) => {
    try {
      const res = await tasksApi.getTask(task._id);
      // API يعيد data: task مباشرة
      const taskData = res.data?.data || res.data;
      setSelectedTask(taskData);
      setShowTaskModal(true);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      await tasksApi.startTask(taskId);
      fetchData();
      if (selectedTask?._id === taskId) {
        const res = await tasksApi.getTask(taskId);
        setSelectedTask(res.data?.data || res.data);
      }
    } catch (error) {
      console.error('Error starting task:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء بدء المهمة');
    }
  };

  const handleCompleteTask = async (taskId) => {
    if (!window.confirm('هل أنت متأكد من إكمال هذه المهمة؟')) return;
    try {
      await tasksApi.completeTask(taskId);
      fetchData();
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error completing task:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء إكمال المهمة');
    }
  };

  const handleCancelTask = async (taskId) => {
    const reason = window.prompt('سبب الإلغاء:');
    if (!reason) return;
    try {
      await tasksApi.cancelTask(taskId, reason);
      fetchData();
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error cancelling task:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء إلغاء المهمة');
    }
  };

  const handleOpenTransferModal = () => {
    setTransferData({ toUserId: '', reason: '' });
    setShowTransferModal(true);
  };

  const handleTransferTask = async () => {
    if (!transferData.toUserId) {
      alert('يرجى اختيار الموظف');
      return;
    }
    try {
      await tasksApi.transferTask(selectedTask._id, transferData);
      fetchData();
      setShowTransferModal(false);
      const res = await tasksApi.getTask(selectedTask._id);
      setSelectedTask(res.data?.data?.task || res.data?.task);
    } catch (error) {
      console.error('Error transferring task:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء تحويل المهمة');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await tasksApi.addNote(selectedTask._id, newNote);
      setNewNote('');
      const res = await tasksApi.getTask(selectedTask._id);
      setSelectedTask(res.data?.data?.task || res.data?.task);
    } catch (error) {
      console.error('Error adding note:', error);
      alert(error.response?.data?.message || 'حدث خطأ أثناء إضافة الملاحظة');
    } finally {
      setAddingNote(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { label: 'جديدة', class: 'status-new' },
      in_progress: { label: 'قيد التنفيذ', class: 'status-progress' },
      completed: { label: 'مكتملة', class: 'status-completed' },
      cancelled: { label: 'ملغاة', class: 'status-cancelled' }
    };
    const config = statusConfig[status] || { label: status, class: '' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // حساب الإحصائيات الزمنية
  const getDateRangeStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    return {
      tomorrow: tasks.filter(t => {
        const date = new Date(t.appointment?.appointmentDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === tomorrow.getTime();
      }).length,

      week: tasks.filter(t => {
        const date = new Date(t.appointment?.appointmentDate);
        date.setHours(0, 0, 0, 0);
        return date >= today && date <= weekEnd;
      }).length,

      month: tasks.filter(t => {
        const date = new Date(t.appointment?.appointmentDate);
        date.setHours(0, 0, 0, 0);
        return date >= today && date <= monthEnd;
      }).length
    };
  };

  const dateStats = getDateRangeStats();

  // حساب إحصائيات أداء الموظفين السريعة
  const getQuickPerformanceStats = () => {
    // حساب أداء الموظفين
    const employeeStats = {};

    tasks.forEach(task => {
      const empId = task.assignedTo?._id;
      const empName = task.assignedTo?.name || 'غير مسند';

      if (!employeeStats[empId || 'unassigned']) {
        employeeStats[empId || 'unassigned'] = {
          id: empId,
          name: empName,
          total: 0,
          completed: 0,
          customers: new Set(), // عدد العملاء الفريدين
          totalPersons: 0       // إجمالي عدد الأشخاص
        };
      }

      const emp = employeeStats[empId || 'unassigned'];
      emp.total++;

      // حساب العملاء والأشخاص للمهام المكتملة
      if (task.status === 'completed') {
        emp.completed++;
        // إضافة العميل (فريد)
        if (task.appointment?.customerName) {
          emp.customers.add(task.appointment.customerName);
        }
        // إضافة عدد الأشخاص
        emp.totalPersons += task.appointment?.personsCount || 1;
      }
    });

    // حساب نسبة الإنجاز لكل موظف
    const empPerformance = Object.values(employeeStats)
      .filter(emp => emp.id) // استبعاد المهام غير المسندة
      .map(emp => ({
        ...emp,
        customers: emp.customers.size, // تحويل Set إلى عدد
        completionRate: emp.total > 0 ? Math.round((emp.completed / emp.total) * 100) : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate);

    // أفضل موظف (أعلى نسبة إنجاز)
    const topEmployee = empPerformance.length > 0 ? empPerformance[0] : null;

    // متوسط نسبة الإنجاز للجميع
    const avgCompletionRate = empPerformance.length > 0
      ? Math.round(empPerformance.reduce((sum, emp) => sum + emp.completionRate, 0) / empPerformance.length)
      : 0;

    // عدد الموظفين النشطين (لديهم مهام)
    const activeEmployees = empPerformance.filter(emp => emp.total > 0).length;

    // إجمالي العملاء والأشخاص لجميع الموظفين
    const totalCustomers = empPerformance.reduce((sum, emp) => sum + emp.customers, 0);
    const totalPersonsServed = empPerformance.reduce((sum, emp) => sum + emp.totalPersons, 0);

    // عدد المهام المتأخرة الإجمالي
    const totalOverdue = tasks.filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      const now = new Date();
      const apptDate = new Date(t.appointment?.appointmentDate);
      return apptDate < now;
    }).length;

    // المهام غير المسندة
    const unassignedTasks = tasks.filter(t => !t.assignedTo).length;

    return {
      topEmployee,
      avgCompletionRate,
      activeEmployees,
      totalOverdue,
      unassignedTasks,
      totalCustomers,
      totalPersonsServed,
      allEmployees: empPerformance // قائمة جميع الموظفين مع إحصائياتهم
    };
  };

  const performanceStats = getQuickPerformanceStats();

  // حساب الوقت المتبقي للمهمة
  const getTimeRemaining = (appointmentDate) => {
    if (!appointmentDate) return null;
    const now = new Date();
    const apptDate = new Date(appointmentDate);
    const diff = apptDate - now;

    if (diff < 0) return { text: 'متأخر', isOverdue: true, hours: Math.abs(Math.floor(diff / (1000 * 60 * 60))) };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return { text: `${days} يوم ${hours} ساعة`, isOverdue: false, days, hours };
    if (hours > 0) return { text: `${hours} ساعة`, isOverdue: false, hours };

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${minutes} دقيقة`, isOverdue: false, minutes };
  };

  // التحقق إذا كانت المهمة متأخرة
  const isTaskOverdue = (task) => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    const timeInfo = getTimeRemaining(task.appointment?.appointmentDate);
    return timeInfo?.isOverdue;
  };

  // حساب نسبة التقدم الإجمالي
  const getProgressPercentage = () => {
    const total = stats.total || 0;
    if (total === 0) return 0;
    return Math.round(((stats.completed || 0) / total) * 100);
  };

  // حساب إجمالي عدد الأشخاص
  const getTotalPersons = () => {
    return tasks.reduce((sum, task) => sum + (task.appointment?.personsCount || 1), 0);
  };

  // مهام اليوم
  const getTodayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return tasks.filter(t => {
      const date = new Date(t.appointment?.appointmentDate);
      return date >= today && date <= todayEnd;
    });
  };

  const todayTasks = getTodayTasks();
  const progressPercentage = getProgressPercentage();

  // دوال التقويم
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    // إضافة الأيام الفارغة في بداية الشهر
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, tasks: [] });
    }

    // إضافة أيام الشهر
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      const dayTasks = tasks.filter(t => {
        const taskDate = new Date(t.appointment?.appointmentDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === date.getTime();
      });

      days.push({ day, date, tasks: dayTasks });
    }

    return days;
  };

  const calendarDays = viewMode === 'calendar' ? getCalendarDays() : [];

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  // ===================================
  // دوال التقارير والإحصائيات
  // ===================================

  // تقييم أداء الموظفين
  const getEmployeePerformance = () => {
    const employeeStats = {};

    tasks.forEach(task => {
      const empId = task.assignedTo?._id;
      const empName = task.assignedTo?.name || 'غير مسند';

      if (!employeeStats[empId || 'unassigned']) {
        employeeStats[empId || 'unassigned'] = {
          id: empId,
          name: empName,
          total: 0,
          completed: 0,
          inProgress: 0,
          new: 0,
          cancelled: 0,
          overdue: 0,
          onTime: 0,
          avgCompletionTime: 0,
          completionTimes: []
        };
      }

      const emp = employeeStats[empId || 'unassigned'];
      emp.total++;

      if (task.status === 'completed') {
        emp.completed++;
        // حساب وقت الإنجاز
        if (task.startedAt && task.completedAt) {
          const completionTime = new Date(task.completedAt) - new Date(task.startedAt);
          emp.completionTimes.push(completionTime / (1000 * 60 * 60)); // بالساعات
        }
        // التحقق من الإنجاز في الوقت
        const appointmentDate = new Date(task.appointment?.appointmentDate);
        const completedDate = new Date(task.completedAt);
        if (completedDate <= appointmentDate) {
          emp.onTime++;
        }
      } else if (task.status === 'in_progress') {
        emp.inProgress++;
      } else if (task.status === 'new') {
        emp.new++;
      } else if (task.status === 'cancelled') {
        emp.cancelled++;
      }

      // المهام المتأخرة
      if (isTaskOverdue(task)) {
        emp.overdue++;
      }
    });

    // حساب متوسط وقت الإنجاز ونسبة الإنجاز
    return Object.values(employeeStats).map(emp => {
      const completionRate = emp.total > 0 ? Math.round((emp.completed / emp.total) * 100) : 0;
      const onTimeRate = emp.completed > 0 ? Math.round((emp.onTime / emp.completed) * 100) : 0;
      const avgTime = emp.completionTimes.length > 0
        ? (emp.completionTimes.reduce((a, b) => a + b, 0) / emp.completionTimes.length).toFixed(1)
        : 0;

      // حساب درجة الأداء
      let performanceScore = 0;
      if (emp.total > 0) {
        performanceScore = Math.round(
          (completionRate * 0.4) + // نسبة الإنجاز 40%
          (onTimeRate * 0.4) + // الالتزام بالوقت 40%
          (100 - Math.min(emp.overdue / emp.total * 100, 100)) * 0.2 // عدم التأخير 20%
        );
      }

      return {
        ...emp,
        completionRate,
        onTimeRate,
        avgCompletionTime: avgTime,
        performanceScore
      };
    }).sort((a, b) => b.performanceScore - a.performanceScore);
  };

  // إحصائيات توزيع المهام حسب القسم
  const getDepartmentStats = () => {
    const deptStats = {};

    tasks.forEach(task => {
      const deptId = task.appointment?.department?._id;
      const deptName = task.appointment?.department?.title || 'بدون قسم';

      if (!deptStats[deptId || 'none']) {
        deptStats[deptId || 'none'] = {
          name: deptName,
          total: 0,
          completed: 0,
          inProgress: 0,
          new: 0,
          cancelled: 0
        };
      }

      deptStats[deptId || 'none'].total++;
      if (task.status === 'completed') deptStats[deptId || 'none'].completed++;
      else if (task.status === 'in_progress') deptStats[deptId || 'none'].inProgress++;
      else if (task.status === 'new') deptStats[deptId || 'none'].new++;
      else if (task.status === 'cancelled') deptStats[deptId || 'none'].cancelled++;
    });

    return Object.values(deptStats).sort((a, b) => b.total - a.total);
  };

  // المهام المتأخرة مع التفاصيل
  const getDelayedTasks = () => {
    return tasks
      .filter(task => isTaskOverdue(task))
      .map(task => {
        const timeInfo = getTimeRemaining(task.appointment?.appointmentDate);
        return {
          ...task,
          delayHours: timeInfo?.hours || 0
        };
      })
      .sort((a, b) => b.delayHours - a.delayHours);
  };

  // إحصائيات حسب الوقت (آخر 7 أيام)
  const getWeeklyStats = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.appointment?.appointmentDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === date.getTime();
      });

      const completedTasks = tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === date.getTime();
      });

      days.push({
        date: date,
        dayName: dayNames[date.getDay()],
        total: dayTasks.length,
        completed: completedTasks.length
      });
    }

    return days;
  };

  const employeePerformance = viewMode === 'reports' ? getEmployeePerformance() : [];
  const departmentStats = viewMode === 'reports' ? getDepartmentStats() : [];
  const delayedTasks = viewMode === 'reports' ? getDelayedTasks() : [];
  const weeklyStats = viewMode === 'reports' ? getWeeklyStats() : [];

  const navigateMonth = (direction) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCalendarMonth(newMonth);
  };

  // دالة تطبيق فلتر التاريخ
  const handleDateFilter = (type) => {
    if (dateRangeFilter.type === type) {
      // إلغاء الفلتر إذا تم النقر مرة أخرى
      setDateRangeFilter({ type: '', startDate: '', endDate: '' });
    } else {
      setDateRangeFilter({ type, startDate: '', endDate: '' });
    }
    setFilterStatus(''); // إلغاء فلتر الحالة عند تفعيل فلتر التاريخ
  };

  // دالة تطبيق فلتر الحالة
  const handleStatusFilter = (status) => {
    if (filterStatus === status) {
      setFilterStatus('');
    } else {
      setFilterStatus(status);
    }
    setDateRangeFilter({ type: '', startDate: '', endDate: '' }); // إلغاء فلتر التاريخ
  };

  // تصفية المهام
  const filteredTasks = tasks.filter(task => {
    // فلترة حسب الحالة
    if (filterStatus && task.status !== filterStatus) return false;

    // فلترة حسب القسم
    if (filterDepartment && task.appointment?.department?._id !== filterDepartment) return false;

    // فلترة حسب الموظف
    if (filterEmployee) {
      if (filterEmployee === 'unassigned') {
        if (task.assignedTo) return false;
      } else {
        if (task.assignedTo?._id !== filterEmployee) return false;
      }
    }

    // فلترة حسب التاريخ (الفلتر القديم)
    if (filterDate) {
      const taskDate = task.appointment?.appointmentDate;
      if (!taskDate) return false;
      const taskDateStr = new Date(taskDate).toISOString().split('T')[0];
      if (taskDateStr !== filterDate) return false;
    }

    // فلترة حسب النطاق الزمني
    if (dateRangeFilter.type) {
      const appointmentDate = new Date(task.appointment?.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateRangeFilter.type === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (appointmentDate.getTime() !== tomorrow.getTime()) return false;
      }

      if (dateRangeFilter.type === 'week') {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (appointmentDate < today || appointmentDate > weekEnd) return false;
      }

      if (dateRangeFilter.type === 'month') {
        const monthEnd = new Date(today);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        if (appointmentDate < today || appointmentDate > monthEnd) return false;
      }

      if (dateRangeFilter.type === 'custom') {
        if (dateRangeFilter.startDate) {
          const start = new Date(dateRangeFilter.startDate);
          start.setHours(0, 0, 0, 0);
          if (appointmentDate < start) return false;
        }
        if (dateRangeFilter.endDate) {
          const end = new Date(dateRangeFilter.endDate);
          end.setHours(23, 59, 59, 999);
          if (appointmentDate > end) return false;
        }
      }
    }

    // البحث
    if (search) {
      const searchLower = search.toLowerCase();
      const customerName = task.appointment?.customerName?.toLowerCase() || '';
      const phone = task.appointment?.phone || '';
      const taskNumber = task.taskNumber?.toLowerCase() || '';
      if (!customerName.includes(searchLower) && !phone.includes(search) && !taskNumber.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  if (loading) return <Loader />;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1>إدارة المهام</h1>
        <div className="header-stats">
          <span className="total-tasks">{stats.total || 0} مهمة</span>
          <span className="total-persons">{getTotalPersons()} شخص</span>
        </div>
      </div>

      {/* ملخص اليوم */}
      {todayTasks.length > 0 && (
        <div className="today-summary">
          <div className="today-header">
            <span className="today-icon">🔔</span>
            <span className="today-title">مهام اليوم ({todayTasks.length})</span>
          </div>
          <div className="today-tasks">
            {todayTasks.slice(0, 5).map(task => (
              <div
                key={task._id}
                className={`today-task-item ${isTaskOverdue(task) ? 'overdue' : ''}`}
                onClick={() => handleViewTask(task)}
              >
                <span className="task-time">{task.appointment?.appointmentTime}</span>
                <span className="task-customer">{task.appointment?.customerName}</span>
                <span className="task-dept">{task.appointment?.department?.title}</span>
                {getStatusBadge(task.status)}
              </div>
            ))}
            {todayTasks.length > 5 && (
              <span className="more-tasks">+{todayTasks.length - 5} مهام أخرى</span>
            )}
          </div>
        </div>
      )}

      {/* بطاقات الإحصائيات - الحالة */}
      <div className="stats-section">
        <button
          className="section-toggle"
          onClick={() => toggleSection('status')}
        >
          <span>{collapsedSections.status ? '◀' : '▼'}</span>
          <span>إحصائيات الحالة</span>
        </button>
      </div>
      {!collapsedSections.status && (
      <div className="stats-cards">
        <Card
          className={`stat-card stat-new ${filterStatus === 'new' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('new')}
        >
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>{stats.new || 0}</h3>
            <p>جديدة</p>
          </div>
        </Card>
        <Card
          className={`stat-card stat-progress ${filterStatus === 'in_progress' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('in_progress')}
        >
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.inProgress || 0}</h3>
            <p>قيد التنفيذ</p>
          </div>
        </Card>
        <Card
          className={`stat-card stat-completed ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => handleStatusFilter('completed')}
        >
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.completed || 0}</h3>
            <p>مكتملة</p>
          </div>
        </Card>
        <Card
          className={`stat-card stat-total ${filterStatus === '' && !dateRangeFilter.type ? 'active' : ''}`}
          onClick={() => { setFilterStatus(''); setDateRangeFilter({ type: '', startDate: '', endDate: '' }); }}
        >
          <div className="progress-circle" style={{ '--progress': progressPercentage }}>
            <svg viewBox="0 0 36 36">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle-progress"
                strokeDasharray={`${progressPercentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="progress-text">{progressPercentage}%</span>
          </div>
          <div className="stat-info">
            <h3>{stats.total || 0}</h3>
            <p>الإجمالي</p>
          </div>
        </Card>
      </div>
      )}

      {/* بطاقات الإحصائيات - الفترة الزمنية */}
      <div className="stats-section">
        <button
          className="section-toggle"
          onClick={() => toggleSection('time')}
        >
          <span>{collapsedSections.time ? '◀' : '▼'}</span>
          <span>الفترة الزمنية</span>
        </button>
      </div>
      {!collapsedSections.time && (
      <div className="stats-cards-time">
        <Card
          className={`time-card time-tomorrow ${dateRangeFilter.type === 'tomorrow' ? 'active' : ''}`}
          onClick={() => handleDateFilter('tomorrow')}
        >
          <h3>{dateStats.tomorrow}</h3>
          <p>مهام غداً</p>
        </Card>
        <Card
          className={`time-card time-week ${dateRangeFilter.type === 'week' ? 'active' : ''}`}
          onClick={() => handleDateFilter('week')}
        >
          <h3>{dateStats.week}</h3>
          <p>مهام الأسبوع</p>
        </Card>
        <Card
          className={`time-card time-month ${dateRangeFilter.type === 'month' ? 'active' : ''}`}
          onClick={() => handleDateFilter('month')}
        >
          <h3>{dateStats.month}</h3>
          <p>مهام الشهر</p>
        </Card>
        {/* فلتر بين تاريخين */}
        <Card
          className={`time-card time-custom ${dateRangeFilter.type === 'custom' ? 'active' : ''}`}
        >
          <p className="custom-label">من</p>
          <input
            type="date"
            value={dateRangeFilter.startDate}
            onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, type: 'custom', startDate: e.target.value })}
          />
          {dateRangeFilter.type === 'custom' && (
            <button
              className="btn-clear-date"
              onClick={(e) => { e.stopPropagation(); setDateRangeFilter({ type: '', startDate: '', endDate: '' }); }}
            >
              ✕
            </button>
          )}
        </Card>
      </div>
      )}


      {/* الفلاتر */}
      <Card className="filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>بحث</label>
            <input
              type="text"
              placeholder="اسم العميل، الهاتف، رقم المهمة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>الحالة</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">الكل</option>
              <option value="new">جديدة</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
          <div className="filter-group">
            <label>القسم</label>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">الكل</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.title}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>الموظف</label>
            <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
              <option value="">الكل</option>
              <option value="unassigned">غير مسند</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>التاريخ</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <button className="btn-clear-filters" onClick={() => {
            setSearch('');
            setFilterStatus('');
            setFilterDepartment('');
            setFilterEmployee('');
            setFilterDate('');
          }}>
            مسح الفلاتر
          </button>
        </div>
      </Card>

      {/* أزرار التبديل بين أوضاع العرض */}
      <div className="view-toggle">
        <button
          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
          title="عرض قائمة"
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
          className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
          onClick={() => setViewMode('kanban')}
          title="عرض كانبان"
        >
          ◫
        </button>
        <button
          className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewMode('calendar')}
          title="عرض تقويم"
        >
          📅
        </button>
        <button
          className={`view-btn ${viewMode === 'reports' ? 'active' : ''}`}
          onClick={() => setViewMode('reports')}
          title="التقارير والإحصائيات"
        >
          📊
        </button>
      </div>

      {/* عرض القائمة */}
      {viewMode === 'list' && (
        <Card className="tasks-table-card">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>رقم المهمة</th>
                <th>العميل</th>
                <th>الهاتف</th>
                <th>القسم</th>
                <th>التاريخ</th>
                <th>الموظف المسؤول</th>
                <th>أضافها</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">لا توجد مهام</td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const timeInfo = getTimeRemaining(task.appointment?.appointmentDate);
                  const overdue = isTaskOverdue(task);
                  return (
                  <tr key={task._id} className={`task-row task-${task.status} ${overdue ? 'task-overdue' : ''}`}>
                    <td className="task-number clickable" onClick={() => handleViewTask(task)}>{task.taskNumber}</td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">
                          {task.appointment?.customerName}
                          {task.appointment?.isVIP && <span className="vip-badge">VIP</span>}
                        </span>
                        <span className="persons-count">{task.appointment?.personsCount || 1} شخص</span>
                      </div>
                    </td>
                    <td>{task.appointment?.phone || '-'}</td>
                    <td>{task.appointment?.department?.title || '-'}</td>
                    <td>
                      <div className="date-info">
                        <span>{formatDate(task.appointment?.appointmentDate)}</span>
                        <span className="time">{task.appointment?.appointmentTime || ''}</span>
                        {timeInfo && task.status !== 'completed' && task.status !== 'cancelled' && (
                          <span className={`time-remaining ${timeInfo.isOverdue ? 'overdue' : ''}`}>
                            {timeInfo.isOverdue ? `⚠️ متأخر ${timeInfo.hours} ساعة` : `⏱️ ${timeInfo.text}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{task.assignedTo?.name || <span className="not-assigned">غير مسند</span>}</td>
                    <td>{task.createdBy?.name || '-'}</td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-view" onClick={() => handleViewTask(task)} title="عرض">
                          👁️
                        </button>
                        {task.status === 'new' && (
                          <button className="btn-action btn-start" onClick={() => handleStartTask(task._id)} title="بدأ العمل">
                            ▶️
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button className="btn-action btn-complete" onClick={() => handleCompleteTask(task._id)} title="إكمال">
                            ✅
                          </button>
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

      {/* عرض الشبكة */}
      {viewMode === 'grid' && (
        <div className="tasks-grid">
          {filteredTasks.length === 0 ? (
            <div className="no-data-grid">لا توجد مهام</div>
          ) : (
            filteredTasks.map(task => (
              <Card key={task._id} className={`task-card task-card-${task.status}`}>
                <div className="task-card-header">
                  <span className="task-card-number" onClick={() => handleViewTask(task)}>{task.taskNumber}</span>
                  {getStatusBadge(task.status)}
                </div>
                <div className="task-card-body" onClick={() => handleViewTask(task)}>
                  <h3 className="task-card-customer">
                    {task.appointment?.customerName}
                    {task.appointment?.isVIP && <span className="vip-badge">VIP</span>}
                  </h3>
                  <div className="task-card-info">
                    <span>📞 {task.appointment?.phone || '-'}</span>
                    <span>🏢 {task.appointment?.department?.title || '-'}</span>
                    <span>📅 {formatDate(task.appointment?.appointmentDate)}</span>
                    <span>⏰ {task.appointment?.appointmentTime || '-'}</span>
                  </div>
                  <div className="task-card-meta">
                    <span>👤 {task.assignedTo?.name || 'غير مسند'}</span>
                    <span>✏️ {task.createdBy?.name || '-'}</span>
                  </div>
                </div>
                <div className="task-card-actions">
                  {task.status === 'new' && (
                    <button className="btn-card-action btn-start" onClick={() => handleStartTask(task._id)}>
                      ▶️ بدء العمل
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button className="btn-card-action btn-complete" onClick={() => handleCompleteTask(task._id)}>
                      ✅ إكمال
                    </button>
                  )}
                  <button className="btn-card-action btn-view" onClick={() => handleViewTask(task)}>
                    👁️ عرض
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* عرض كانبان */}
      {viewMode === 'kanban' && (
        <div className="kanban-board">
          {/* عمود المهام الجديدة */}
          <div className="kanban-column kanban-new">
            <div className="kanban-header">
              <span className="kanban-dot new"></span>
              <h3>جديدة</h3>
              <span className="kanban-count">{filteredTasks.filter(t => t.status === 'new').length}</span>
            </div>
            <div className="kanban-tasks">
              {filteredTasks.filter(t => t.status === 'new').map(task => {
                const timeInfo = getTimeRemaining(task.appointment?.appointmentDate);
                const overdue = isTaskOverdue(task);
                return (
                  <div
                    key={task._id}
                    className={`kanban-task ${overdue ? 'overdue' : ''}`}
                    onClick={() => handleViewTask(task)}
                  >
                    <div className="kanban-task-header">
                      <span className="task-number">{task.taskNumber}</span>
                      {task.appointment?.isVIP && <span className="vip-badge">VIP</span>}
                    </div>
                    <h4>{task.appointment?.customerName}</h4>
                    <div className="kanban-task-info">
                      <span>📅 {formatDate(task.appointment?.appointmentDate)}</span>
                      <span>⏰ {task.appointment?.appointmentTime}</span>
                    </div>
                    <div className="kanban-task-footer">
                      <span className="assignee">👤 {task.assignedTo?.name || 'غير مسند'}</span>
                      {timeInfo && (
                        <span className={`time-badge ${timeInfo.isOverdue ? 'overdue' : ''}`}>
                          {timeInfo.text}
                        </span>
                      )}
                    </div>
                    <button
                      className="kanban-action"
                      onClick={(e) => { e.stopPropagation(); handleStartTask(task._id); }}
                    >
                      ▶️ بدء العمل
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* عمود المهام قيد التنفيذ */}
          <div className="kanban-column kanban-progress">
            <div className="kanban-header">
              <span className="kanban-dot progress"></span>
              <h3>قيد التنفيذ</h3>
              <span className="kanban-count">{filteredTasks.filter(t => t.status === 'in_progress').length}</span>
            </div>
            <div className="kanban-tasks">
              {filteredTasks.filter(t => t.status === 'in_progress').map(task => {
                const timeInfo = getTimeRemaining(task.appointment?.appointmentDate);
                const overdue = isTaskOverdue(task);
                return (
                  <div
                    key={task._id}
                    className={`kanban-task ${overdue ? 'overdue' : ''}`}
                    onClick={() => handleViewTask(task)}
                  >
                    <div className="kanban-task-header">
                      <span className="task-number">{task.taskNumber}</span>
                      {task.appointment?.isVIP && <span className="vip-badge">VIP</span>}
                    </div>
                    <h4>{task.appointment?.customerName}</h4>
                    <div className="kanban-task-info">
                      <span>📅 {formatDate(task.appointment?.appointmentDate)}</span>
                      <span>⏰ {task.appointment?.appointmentTime}</span>
                    </div>
                    <div className="kanban-task-footer">
                      <span className="assignee">👤 {task.assignedTo?.name || 'غير مسند'}</span>
                      {timeInfo && (
                        <span className={`time-badge ${timeInfo.isOverdue ? 'overdue' : ''}`}>
                          {timeInfo.text}
                        </span>
                      )}
                    </div>
                    <button
                      className="kanban-action complete"
                      onClick={(e) => { e.stopPropagation(); handleCompleteTask(task._id); }}
                    >
                      ✅ إكمال
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* عمود المهام المكتملة */}
          <div className="kanban-column kanban-completed">
            <div className="kanban-header">
              <span className="kanban-dot completed"></span>
              <h3>مكتملة</h3>
              <span className="kanban-count">{filteredTasks.filter(t => t.status === 'completed').length}</span>
            </div>
            <div className="kanban-tasks">
              {filteredTasks.filter(t => t.status === 'completed').slice(0, 10).map(task => (
                <div
                  key={task._id}
                  className="kanban-task completed"
                  onClick={() => handleViewTask(task)}
                >
                  <div className="kanban-task-header">
                    <span className="task-number">{task.taskNumber}</span>
                    {task.appointment?.isVIP && <span className="vip-badge">VIP</span>}
                  </div>
                  <h4>{task.appointment?.customerName}</h4>
                  <div className="kanban-task-info">
                    <span>📅 {formatDate(task.appointment?.appointmentDate)}</span>
                    <span>✓ {formatDate(task.completedAt)}</span>
                  </div>
                  <div className="kanban-task-footer">
                    <span className="assignee">👤 {task.assignedTo?.name || '-'}</span>
                  </div>
                </div>
              ))}
              {filteredTasks.filter(t => t.status === 'completed').length > 10 && (
                <div className="kanban-more">
                  +{filteredTasks.filter(t => t.status === 'completed').length - 10} مهام أخرى
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* عرض التقويم */}
      {viewMode === 'calendar' && (
        <Card className="calendar-container">
          <div className="calendar-header">
            <button className="calendar-nav" onClick={() => navigateMonth(-1)}>
              ‹
            </button>
            <h3>{monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</h3>
            <button className="calendar-nav" onClick={() => navigateMonth(1)}>
              ›
            </button>
          </div>

          <div className="calendar-grid">
            {/* رؤوس الأيام */}
            {dayNames.map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}

            {/* أيام الشهر */}
            {calendarDays.map((dayInfo, index) => {
              const isToday = dayInfo.date && new Date().toDateString() === dayInfo.date.toDateString();
              const hasNew = dayInfo.tasks.some(t => t.status === 'new');
              const hasProgress = dayInfo.tasks.some(t => t.status === 'in_progress');
              const hasCompleted = dayInfo.tasks.some(t => t.status === 'completed');

              return (
                <div
                  key={index}
                  className={`calendar-day ${!dayInfo.day ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                >
                  {dayInfo.day && (
                    <>
                      <span className="day-number">{dayInfo.day}</span>
                      {dayInfo.tasks.length > 0 && (
                        <div className="day-tasks">
                          {dayInfo.tasks.slice(0, 3).map(task => (
                            <div
                              key={task._id}
                              className={`day-task day-task-${task.status}`}
                              onClick={() => handleViewTask(task)}
                              title={task.appointment?.customerName}
                            >
                              <span className="task-time-mini">
                                {task.appointment?.appointmentTime?.substring(0, 5)}
                              </span>
                              <span className="task-name-mini">
                                {task.appointment?.customerName?.substring(0, 10)}
                              </span>
                            </div>
                          ))}
                          {dayInfo.tasks.length > 3 && (
                            <div className="more-day-tasks">
                              +{dayInfo.tasks.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      {dayInfo.tasks.length > 0 && (
                        <div className="day-indicators">
                          {hasNew && <span className="indicator new"></span>}
                          {hasProgress && <span className="indicator progress"></span>}
                          {hasCompleted && <span className="indicator completed"></span>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span className="legend-item"><span className="indicator new"></span> جديدة</span>
            <span className="legend-item"><span className="indicator progress"></span> قيد التنفيذ</span>
            <span className="legend-item"><span className="indicator completed"></span> مكتملة</span>
          </div>
        </Card>
      )}

      {/* عرض التقارير */}
      {viewMode === 'reports' && (
        <div className="reports-section">
          {/* تبويبات التقارير */}
          <div className="reports-tabs">
            <button
              className={`report-tab ${reportType === 'performance' ? 'active' : ''}`}
              onClick={() => setReportType('performance')}
            >
              <span className="tab-icon">👥</span>
              تقييم الأداء
            </button>
            <button
              className={`report-tab ${reportType === 'productivity' ? 'active' : ''}`}
              onClick={() => setReportType('productivity')}
            >
              <span className="tab-icon">📈</span>
              الإنتاجية
            </button>
            <button
              className={`report-tab ${reportType === 'delays' ? 'active' : ''}`}
              onClick={() => setReportType('delays')}
            >
              <span className="tab-icon">⏰</span>
              التأخيرات
            </button>
          </div>

          {/* تقرير تقييم الأداء */}
          {reportType === 'performance' && (
            <div className="report-content">
              <Card className="report-card">
                <div className="report-header">
                  <h3>تقييم أداء الموظفين</h3>
                  <span className="report-subtitle">ترتيب الموظفين حسب درجة الأداء</span>
                </div>

                <div className="performance-list">
                  {employeePerformance.map((emp, index) => (
                    <div key={emp.id || 'unassigned'} className="performance-card">
                      <div className="performance-rank">
                        <span className={`rank-badge rank-${index < 3 ? index + 1 : 'other'}`}>
                          {index + 1}
                        </span>
                      </div>

                      <div className="performance-info">
                        <div className="emp-header">
                          <span className="emp-avatar">{emp.name[0]}</span>
                          <div className="emp-details">
                            <span className="emp-name">{emp.name}</span>
                            <span className="emp-tasks">{emp.total} مهمة</span>
                          </div>
                        </div>

                        <div className="performance-metrics">
                          <div className="metric">
                            <span className="metric-label">نسبة الإنجاز</span>
                            <div className="metric-bar">
                              <div
                                className="metric-fill completion"
                                style={{ width: `${emp.completionRate}%` }}
                              ></div>
                            </div>
                            <span className="metric-value">{emp.completionRate}%</span>
                          </div>

                          <div className="metric">
                            <span className="metric-label">الالتزام بالوقت</span>
                            <div className="metric-bar">
                              <div
                                className="metric-fill ontime"
                                style={{ width: `${emp.onTimeRate}%` }}
                              ></div>
                            </div>
                            <span className="metric-value">{emp.onTimeRate}%</span>
                          </div>
                        </div>

                        <div className="performance-stats">
                          <span className="stat-item completed">
                            <span className="stat-num">{emp.completed}</span>
                            مكتملة
                          </span>
                          <span className="stat-item progress">
                            <span className="stat-num">{emp.inProgress}</span>
                            قيد التنفيذ
                          </span>
                          <span className="stat-item overdue">
                            <span className="stat-num">{emp.overdue}</span>
                            متأخرة
                          </span>
                          {emp.avgCompletionTime > 0 && (
                            <span className="stat-item time">
                              <span className="stat-num">{emp.avgCompletionTime}</span>
                              ساعة متوسط
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="performance-score">
                        <svg viewBox="0 0 36 36" className="score-circle">
                          <path
                            className="score-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`score-fill ${emp.performanceScore >= 70 ? 'good' : emp.performanceScore >= 40 ? 'medium' : 'low'}`}
                            strokeDasharray={`${emp.performanceScore}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className={`score-text ${emp.performanceScore >= 70 ? 'good' : emp.performanceScore >= 40 ? 'medium' : 'low'}`}>
                          {emp.performanceScore}
                        </span>
                        <span className="score-label">درجة الأداء</span>
                      </div>
                    </div>
                  ))}

                  {employeePerformance.length === 0 && (
                    <p className="no-data-report">لا توجد بيانات كافية</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* تقرير الإنتاجية */}
          {reportType === 'productivity' && (
            <div className="report-content">
              {/* رسم بياني أسبوعي */}
              <Card className="report-card">
                <div className="report-header">
                  <h3>الإنتاجية الأسبوعية</h3>
                  <span className="report-subtitle">آخر 7 أيام</span>
                </div>

                <div className="weekly-chart">
                  {weeklyStats.map((day, index) => {
                    const maxTotal = Math.max(...weeklyStats.map(d => d.total), 1);
                    const totalHeight = (day.total / maxTotal) * 100;
                    const completedHeight = (day.completed / maxTotal) * 100;

                    return (
                      <div key={index} className="chart-day">
                        <div className="chart-bars">
                          <div
                            className="chart-bar total"
                            style={{ height: `${totalHeight}%` }}
                            title={`إجمالي: ${day.total}`}
                          >
                            <span className="bar-value">{day.total}</span>
                          </div>
                          <div
                            className="chart-bar completed"
                            style={{ height: `${completedHeight}%` }}
                            title={`مكتملة: ${day.completed}`}
                          >
                            {day.completed > 0 && <span className="bar-value">{day.completed}</span>}
                          </div>
                        </div>
                        <span className="chart-label">{day.dayName}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="chart-legend">
                  <span className="legend-item">
                    <span className="legend-color total"></span>
                    المهام المجدولة
                  </span>
                  <span className="legend-item">
                    <span className="legend-color completed"></span>
                    المهام المكتملة
                  </span>
                </div>
              </Card>

              {/* توزيع المهام حسب القسم */}
              <Card className="report-card">
                <div className="report-header">
                  <h3>توزيع المهام حسب القسم</h3>
                  <span className="report-subtitle">جميع الأقسام</span>
                </div>

                <div className="department-stats">
                  {departmentStats.map((dept, index) => {
                    const maxTotal = Math.max(...departmentStats.map(d => d.total), 1);
                    const percentage = Math.round((dept.total / tasks.length) * 100);
                    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

                    return (
                      <div key={index} className="dept-stat-item">
                        <div className="dept-info">
                          <span
                            className="dept-color"
                            style={{ backgroundColor: colors[index % colors.length] }}
                          ></span>
                          <span className="dept-name">{dept.name}</span>
                          <span className="dept-percentage">{percentage}%</span>
                        </div>

                        <div className="dept-bar-container">
                          <div
                            className="dept-bar"
                            style={{
                              width: `${(dept.total / maxTotal) * 100}%`,
                              backgroundColor: colors[index % colors.length]
                            }}
                          ></div>
                        </div>

                        <div className="dept-details">
                          <span className="dept-total">{dept.total} مهمة</span>
                          <span className="dept-breakdown">
                            <span className="completed">{dept.completed} ✓</span>
                            <span className="progress">{dept.inProgress} ◐</span>
                            <span className="new">{dept.new} ○</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {departmentStats.length === 0 && (
                    <p className="no-data-report">لا توجد بيانات كافية</p>
                  )}
                </div>
              </Card>

              {/* إحصائيات ملخصة */}
              <div className="summary-stats">
                <Card className="summary-card">
                  <div className="summary-icon">📊</div>
                  <div className="summary-info">
                    <span className="summary-value">{stats.total || 0}</span>
                    <span className="summary-label">إجمالي المهام</span>
                  </div>
                </Card>
                <Card className="summary-card">
                  <div className="summary-icon">✅</div>
                  <div className="summary-info">
                    <span className="summary-value">{stats.completed || 0}</span>
                    <span className="summary-label">مكتملة</span>
                  </div>
                </Card>
                <Card className="summary-card">
                  <div className="summary-icon">📈</div>
                  <div className="summary-info">
                    <span className="summary-value">{progressPercentage}%</span>
                    <span className="summary-label">نسبة الإنجاز</span>
                  </div>
                </Card>
                <Card className="summary-card">
                  <div className="summary-icon">👥</div>
                  <div className="summary-info">
                    <span className="summary-value">{getTotalPersons()}</span>
                    <span className="summary-label">إجمالي الأشخاص</span>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* تقرير التأخيرات */}
          {reportType === 'delays' && (
            <div className="report-content">
              <Card className="report-card">
                <div className="report-header">
                  <h3>المهام المتأخرة</h3>
                  <span className="report-subtitle">{delayedTasks.length} مهمة متأخرة</span>
                </div>

                {delayedTasks.length > 0 ? (
                  <div className="delays-list">
                    {delayedTasks.map(task => (
                      <div
                        key={task._id}
                        className="delay-item"
                        onClick={() => handleViewTask(task)}
                      >
                        <div className="delay-severity">
                          <span className={`severity-badge ${task.delayHours > 24 ? 'critical' : task.delayHours > 6 ? 'high' : 'medium'}`}>
                            {task.delayHours > 24 ? '!' : task.delayHours > 6 ? '⚠' : '●'}
                          </span>
                        </div>

                        <div className="delay-info">
                          <div className="delay-header">
                            <span className="task-number">{task.taskNumber}</span>
                            <span className="customer-name">{task.appointment?.customerName}</span>
                            {getStatusBadge(task.status)}
                          </div>

                          <div className="delay-details">
                            <span className="detail-item">
                              📅 موعد: {formatDate(task.appointment?.appointmentDate)} {task.appointment?.appointmentTime}
                            </span>
                            <span className="detail-item">
                              🏢 {task.appointment?.department?.title || '-'}
                            </span>
                            <span className="detail-item">
                              👤 {task.assignedTo?.name || 'غير مسند'}
                            </span>
                          </div>
                        </div>

                        <div className="delay-time">
                          <span className="delay-hours">{task.delayHours}</span>
                          <span className="delay-label">ساعة تأخير</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-delays">
                    <span className="no-delays-icon">🎉</span>
                    <p>لا توجد مهام متأخرة</p>
                    <span className="no-delays-subtitle">جميع المهام في الوقت المحدد</span>
                  </div>
                )}
              </Card>

              {/* إحصائيات التأخير */}
              {delayedTasks.length > 0 && (
                <div className="delay-stats-grid">
                  <Card className="delay-stat-card">
                    <div className="delay-stat-header">
                      <span className="delay-stat-icon critical">!</span>
                      <span className="delay-stat-title">تأخير حرج</span>
                    </div>
                    <span className="delay-stat-value">
                      {delayedTasks.filter(t => t.delayHours > 24).length}
                    </span>
                    <span className="delay-stat-desc">أكثر من 24 ساعة</span>
                  </Card>

                  <Card className="delay-stat-card">
                    <div className="delay-stat-header">
                      <span className="delay-stat-icon high">⚠</span>
                      <span className="delay-stat-title">تأخير عالي</span>
                    </div>
                    <span className="delay-stat-value">
                      {delayedTasks.filter(t => t.delayHours > 6 && t.delayHours <= 24).length}
                    </span>
                    <span className="delay-stat-desc">6-24 ساعة</span>
                  </Card>

                  <Card className="delay-stat-card">
                    <div className="delay-stat-header">
                      <span className="delay-stat-icon medium">●</span>
                      <span className="delay-stat-title">تأخير متوسط</span>
                    </div>
                    <span className="delay-stat-value">
                      {delayedTasks.filter(t => t.delayHours <= 6).length}
                    </span>
                    <span className="delay-stat-desc">أقل من 6 ساعات</span>
                  </Card>

                  <Card className="delay-stat-card">
                    <div className="delay-stat-header">
                      <span className="delay-stat-icon total">⏱</span>
                      <span className="delay-stat-title">متوسط التأخير</span>
                    </div>
                    <span className="delay-stat-value">
                      {delayedTasks.length > 0
                        ? Math.round(delayedTasks.reduce((sum, t) => sum + t.delayHours, 0) / delayedTasks.length)
                        : 0}
                    </span>
                    <span className="delay-stat-desc">ساعة</span>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal تفاصيل المهمة - تصميم جديد */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title=""
        size="xlarge"
      >
        {selectedTask && (
          <div className="task-detail-modal">
            {/* القسم الأيسر - المحتوى الرئيسي */}
            <div className="task-detail-main">
              {/* العنوان */}
              <div className="task-detail-header">
                <h2>{selectedTask.appointment?.customerName}</h2>
                {selectedTask.appointment?.isVIP && <span className="vip-badge-lg">VIP</span>}
                <span className="task-number-badge">{selectedTask.taskNumber}</span>
              </div>

              {/* الوصف / ملاحظات الموعد */}
              <div className="task-detail-section">
                <div className="section-title-new">
                  <span className="section-icon">📋</span>
                  <span>تفاصيل الموعد</span>
                </div>
                <div className="task-description">
                  <div className="desc-row">
                    <span className="desc-label">القسم:</span>
                    <span className="desc-value">{selectedTask.appointment?.department?.title || '-'}</span>
                  </div>
                  <div className="desc-row">
                    <span className="desc-label">المدينة:</span>
                    <span className="desc-value">{selectedTask.appointment?.city || '-'}</span>
                  </div>
                  <div className="desc-row">
                    <span className="desc-label">عدد الأشخاص:</span>
                    <span className="desc-value">{selectedTask.appointment?.personsCount || 1} شخص</span>
                  </div>
                  {selectedTask.appointment?.notes && (
                    <div className="desc-notes">
                      <p>{selectedTask.appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* قائمة المهام / Checklist */}
              <div className="task-detail-section">
                <div className="section-title-new">
                  <span className="section-icon">✅</span>
                  <span>حالة المهمة</span>
                </div>
                <div className="task-checklist">
                  <div className={`checklist-item ${selectedTask.createdAt ? 'checked' : ''}`}>
                    <span className="check-icon">{selectedTask.createdAt ? '✓' : '○'}</span>
                    <span>تم إنشاء المهمة</span>
                  </div>
                  <div className={`checklist-item ${selectedTask.startedAt ? 'checked' : ''}`}>
                    <span className="check-icon">{selectedTask.startedAt ? '✓' : '○'}</span>
                    <span>بدأ العمل على المهمة</span>
                  </div>
                  <div className={`checklist-item ${selectedTask.completedAt ? 'checked' : ''}`}>
                    <span className="check-icon">{selectedTask.completedAt ? '✓' : '○'}</span>
                    <span>تم إكمال المهمة</span>
                  </div>
                </div>
              </div>

              {/* المرفقات */}
              <div className="task-detail-section">
                <div className="section-title-new">
                  <span className="section-icon">📎</span>
                  <span>المرفقات</span>
                </div>
                <div className="task-attachments-grid">
                  {selectedTask.appointment?.attachments?.map((att, index) => (
                    <a key={`appt-${index}`} href={att.url} target="_blank" rel="noopener noreferrer" className="attachment-card">
                      <div className="attachment-icon-new">📄</div>
                      <div className="attachment-info-new">
                        <span className="attachment-name">{att.originalName || att.filename}</span>
                        <span className="attachment-meta">مرفق موعد</span>
                      </div>
                    </a>
                  ))}
                  {selectedTask.taskAttachments?.map((att, index) => (
                    <a key={`task-${index}`} href={att.url} target="_blank" rel="noopener noreferrer" className="attachment-card">
                      <div className="attachment-icon-new">📄</div>
                      <div className="attachment-info-new">
                        <span className="attachment-name">{att.originalName || att.filename}</span>
                        <span className="attachment-meta">مرفق مهمة</span>
                      </div>
                    </a>
                  ))}
                  {!selectedTask.appointment?.attachments?.length && !selectedTask.taskAttachments?.length && (
                    <p className="no-items">لا توجد مرفقات</p>
                  )}
                </div>
              </div>

              {/* الملاحظات */}
              <div className="task-detail-section">
                <div className="section-title-new">
                  <span className="section-icon">💬</span>
                  <span>الملاحظات</span>
                </div>
                <div className="task-comments">
                  {selectedTask.taskNotes?.map((note, index) => (
                    <div key={index} className="comment-item">
                      <div className="comment-avatar">
                        {(note.createdBy?.name || 'م')[0]}
                      </div>
                      <div className="comment-content">
                        <div className="comment-header-new">
                          <span className="comment-author">{note.createdBy?.name || 'مجهول'}</span>
                          <span className="comment-time">{formatDateTime(note.createdAt)}</span>
                        </div>
                        <p className="comment-text">{note.content}</p>
                      </div>
                    </div>
                  ))}
                  {!selectedTask.taskNotes?.length && (
                    <p className="no-items">لا توجد ملاحظات</p>
                  )}
                </div>

                {/* إضافة ملاحظة */}
                {(selectedTask.status === 'new' || selectedTask.status === 'in_progress') && (
                  <div className="add-comment-form">
                    <textarea
                      placeholder="أضف ملاحظة..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={2}
                    />
                    <button
                      className="btn-add-comment"
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                    >
                      {addingNote ? '...' : 'إضافة'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* القسم الأيمن - المعلومات والإجراءات */}
            <div className="task-detail-sidebar">
              {/* الموظف المسؤول */}
              <div className="sidebar-section">
                <h4>الموظف المسؤول</h4>
                <div className="assigned-user">
                  <div className="user-avatar">
                    {selectedTask.assignedTo?.name ? selectedTask.assignedTo.name[0] : '؟'}
                  </div>
                  <span className="user-name">{selectedTask.assignedTo?.name || 'غير مسند'}</span>
                  {(selectedTask.status === 'new' || selectedTask.status === 'in_progress') && (
                    <button className="btn-change-user" onClick={handleOpenTransferModal}>+</button>
                  )}
                </div>
              </div>

              {/* معلومات العميل */}
              <div className="sidebar-section">
                <h4>معلومات العميل</h4>
                <div className="info-list">
                  <div className="info-row">
                    <span className="info-icon">📞</span>
                    <span className="info-label">الهاتف:</span>
                    <span className="info-value">{selectedTask.appointment?.phone || '-'}</span>
                  </div>
                </div>
              </div>

              {/* التواريخ */}
              <div className="sidebar-section">
                <h4>التواريخ</h4>
                <div className="info-list">
                  <div className="info-row">
                    <span className="info-icon">📅</span>
                    <span className="info-label">الموعد:</span>
                    <span className="info-value clickable">{formatDate(selectedTask.appointment?.appointmentDate)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-icon">⏰</span>
                    <span className="info-label">الوقت:</span>
                    <span className="info-value">{selectedTask.appointment?.appointmentTime || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-icon">📝</span>
                    <span className="info-label">الإنشاء:</span>
                    <span className="info-value">{formatDate(selectedTask.createdAt)}</span>
                  </div>
                  {selectedTask.startedAt && (
                    <div className="info-row">
                      <span className="info-icon">▶️</span>
                      <span className="info-label">البدء:</span>
                      <span className="info-value">{formatDate(selectedTask.startedAt)}</span>
                    </div>
                  )}
                  {selectedTask.completedAt && (
                    <div className="info-row">
                      <span className="info-icon">✅</span>
                      <span className="info-label">الإكمال:</span>
                      <span className="info-value">{formatDate(selectedTask.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* الحالة */}
              <div className="sidebar-section">
                <h4>الحالة</h4>
                <div className="info-list">
                  <div className="info-row">
                    <span className="info-icon">🚦</span>
                    <span className="info-label">الحالة:</span>
                    {getStatusBadge(selectedTask.status)}
                  </div>
                </div>
              </div>

              {/* سجل التحويلات */}
              {selectedTask.transferHistory?.length > 0 && (
                <div className="sidebar-section">
                  <h4>سجل التحويلات</h4>
                  <div className="transfer-history-list">
                    {selectedTask.transferHistory.map((transfer, index) => (
                      <div key={index} className="transfer-history-item">
                        <span>{transfer.from?.name || '?'}</span>
                        <span className="arrow">←</span>
                        <span>{transfer.to?.name || '?'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* الإجراءات */}
              <div className="sidebar-section sidebar-actions">
                <h4>الإجراءات</h4>
                <div className="action-buttons-list">
                  {selectedTask.status === 'new' && (
                    <button className="action-btn action-start" onClick={() => handleStartTask(selectedTask._id)}>
                      <span className="action-icon">▶️</span>
                      <span>بدء العمل</span>
                    </button>
                  )}
                  {selectedTask.status === 'in_progress' && (
                    <button className="action-btn action-complete" onClick={() => handleCompleteTask(selectedTask._id)}>
                      <span className="action-icon">✅</span>
                      <span>إكمال المهمة</span>
                    </button>
                  )}
                  {(selectedTask.status === 'new' || selectedTask.status === 'in_progress') && (
                    <button className="action-btn action-cancel" onClick={() => handleCancelTask(selectedTask._id)}>
                      <span className="action-icon">🗑️</span>
                      <span>إلغاء</span>
                    </button>
                  )}
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="sidebar-section sidebar-info-table">
                <h4>معلومات</h4>
                <div className="info-table">
                  <div className="info-table-row">
                    <span>رقم المهمة</span>
                    <span>{selectedTask.taskNumber}</span>
                  </div>
                  <div className="info-table-row">
                    <span>أنشئت بواسطة</span>
                    <span>{selectedTask.createdBy?.name || '-'}</span>
                  </div>
                  <div className="info-table-row">
                    <span>تاريخ الإنشاء</span>
                    <span>{formatDate(selectedTask.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal تحويل المهمة */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="تحويل المهمة"
        size="small"
      >
        <div className="transfer-form">
          <div className="form-group">
            <label>تحويل إلى:</label>
            <select
              value={transferData.toUserId}
              onChange={(e) => setTransferData({ ...transferData, toUserId: e.target.value })}
            >
              <option value="">اختر الموظف</option>
              {employees.filter(emp => emp._id !== selectedTask?.assignedTo?._id).map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>سبب التحويل (اختياري):</label>
            <textarea
              value={transferData.reason}
              onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
              placeholder="أدخل سبب التحويل..."
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowTransferModal(false)}>
              إلغاء
            </button>
            <button className="btn-primary" onClick={handleTransferTask}>
              تحويل
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
