import { useState, useEffect } from 'react';
import { tripsApi } from '../../api';
import { Button, Card, Loader, Modal, Input } from '../../components/common';
import { formatCurrency, formatDate, TRIP_CATEGORIES } from '../../utils';
import './Trips.css';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await tripsApi.getTrips();
      setTrips(response.data.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="trips-page">
      <div className="page-header">
        <h1>إدارة الرحلات</h1>
        <Button onClick={() => setShowModal(true)}>
          + إضافة رحلة
        </Button>
      </div>

      {trips.length === 0 ? (
        <Card className="empty-card">
          <div className="empty-state">
            <span className="empty-icon">✈️</span>
            <h3>لا توجد رحلات</h3>
            <p>قم بإضافة رحلة جديدة للبدء</p>
            <Button onClick={() => setShowModal(true)}>
              إضافة رحلة
            </Button>
          </div>
        </Card>
      ) : (
        <div className="trips-grid">
          {trips.map(trip => (
            <Card
              key={trip._id}
              hoverable
              className="trip-card"
            >
              <div className="trip-category">
                {TRIP_CATEGORIES[trip.category] || trip.category}
              </div>
              <h3>{trip.title}</h3>
              <p className="trip-destination">
                {trip.origin} → {trip.destination}
              </p>
              <div className="trip-dates">
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </div>
              <div className="trip-footer">
                <span className="trip-price">
                  {formatCurrency(trip.price)}
                </span>
                <span className="trip-seats">
                  {trip.availableSeats} / {trip.totalSeats} مقعد
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="إضافة رحلة جديدة"
        size="large"
      >
        <p>نموذج إضافة الرحلة سيتم إضافته قريباً</p>
      </Modal>
    </div>
  );
};

export default Trips;
