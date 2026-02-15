import { useState, useEffect } from 'react';
import { bookingsApi } from '../../api';
import { Button, Card, Loader } from '../../components/common';
import { formatCurrency, formatDate, BOOKING_STATUS, PAYMENT_STATUS } from '../../utils';
import './Bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingsApi.getBookings();
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1>إدارة الحجوزات</h1>
        <Button>+ حجز جديد</Button>
      </div>

      {bookings.length === 0 ? (
        <Card className="empty-card">
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>لا توجد حجوزات</h3>
            <p>لم يتم إنشاء أي حجوزات بعد</p>
          </div>
        </Card>
      ) : (
        <Card className="bookings-table-card">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>رقم الحجز</th>
                <th>الرحلة</th>
                <th>العميل</th>
                <th>عدد المسافرين</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>الدفع</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.bookingNumber}</td>
                  <td>{booking.trip?.title || '-'}</td>
                  <td>{booking.customer?.name || booking.user?.name || '-'}</td>
                  <td>{booking.numberOfPassengers}</td>
                  <td>{formatCurrency(booking.finalPrice)}</td>
                  <td>
                    <span className={`status-badge status-${booking.status}`}>
                      {BOOKING_STATUS[booking.status]?.label}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge payment-${booking.paymentStatus}`}>
                      {PAYMENT_STATUS[booking.paymentStatus]?.label}
                    </span>
                  </td>
                  <td>{formatDate(booking.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default Bookings;
