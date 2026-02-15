import { useState, useEffect } from 'react';
import './ArabicCalendar.css';

const ArabicCalendar = ({
  value,
  onChange,
  minDate,
  appointmentCounts = {},
  disableWeekends = true
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const arabicDays = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];

  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value));
    }
  }, [value]);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 5 || day === 6; // الجمعة = 5، السبت = 6
  };

  const isDateDisabled = (date) => {
    if (minDate && date < new Date(minDate)) {
      return true;
    }
    if (disableWeekends && isWeekend(date)) {
      return true;
    }
    return false;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!value) return false;
    return date.toDateString() === new Date(value).toDateString();
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getAppointmentCount = (date) => {
    const key = formatDateKey(date);
    return appointmentCounts[key] || 0;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;

    const dateStr = date.toISOString().split('T')[0];
    onChange({ target: { value: dateStr } });
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const disabled = isDateDisabled(date);
      const weekend = isWeekend(date);
      const today = isToday(date);
      const selected = isSelected(date);
      const count = getAppointmentCount(date);

      const classNames = [
        'calendar-day',
        disabled && 'disabled',
        weekend && 'weekend',
        today && 'today',
        selected && 'selected',
        count > 0 && 'has-appointments'
      ].filter(Boolean).join(' ');

      days.push(
        <div
          key={day}
          className={classNames}
          onClick={() => handleDateClick(date)}
        >
          <span className="day-number">{day}</span>
          {count > 0 && <span className="appointment-count">{count}</span>}
        </div>
      );
    }

    return days;
  };

  const formatDisplayDate = () => {
    if (!value) return 'اختر التاريخ';
    const date = new Date(value);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return `${days[date.getDay()]} ${date.getDate()} ${arabicMonths[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="arabic-calendar-wrapper">
      <div className="calendar-input" onClick={() => setIsOpen(!isOpen)}>
        <span className="calendar-icon">📅</span>
        <span className="calendar-value">{formatDisplayDate()}</span>
        <span className="calendar-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="calendar-dropdown">
          <div className="calendar-header">
            <button type="button" className="nav-btn" onClick={handlePrevMonth}>
              ◀
            </button>
            <span className="current-month">
              {arabicMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button type="button" className="nav-btn" onClick={handleNextMonth}>
              ▶
            </button>
          </div>

          <div className="calendar-weekdays">
            {arabicDays.map((day, index) => (
              <div
                key={day}
                className={`weekday ${index === 5 || index === 6 ? 'weekend' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {renderCalendar()}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot available"></span>
              <span>متاح</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot weekend"></span>
              <span>إجازة</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot has-appointments"></span>
              <span>يوجد مواعيد</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArabicCalendar;
