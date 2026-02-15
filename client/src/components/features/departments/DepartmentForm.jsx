import { useState, useEffect } from 'react';
import settingsApi from '../../../api/settingsApi';
import './DepartmentForm.css';

const DepartmentForm = ({ department, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    cities: []
  });
  const [newCity, setNewCity] = useState({ name: '', mapLink: '' });
  const [loading, setLoading] = useState(false);
  const [availableCities, setAvailableCities] = useState(['الرياض', 'جدة', 'الدمام']);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (department) {
      setFormData({
        title: department.title || '',
        cities: department.cities || []
      });
    }
  }, [department]);

  const fetchCities = async () => {
    try {
      const response = await settingsApi.getSettings();
      const cities = response.data?.data?.cities || [];
      const enabledCities = cities.filter(c => c.enabled).map(c => c.name);
      if (enabledCities.length > 0) {
        setAvailableCities(enabledCities);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleAddCity = () => {
    if (!newCity.name) return;
    if (formData.cities.length >= 3) {
      alert('لا يمكن إضافة أكثر من 3 مدن');
      return;
    }
    if (formData.cities.find(c => c.name === newCity.name)) {
      alert('المدينة مضافة مسبقاً');
      return;
    }

    setFormData(prev => ({
      ...prev,
      cities: [...prev.cities, { ...newCity }]
    }));
    setNewCity({ name: '', mapLink: '' });
  };

  const handleRemoveCity = (cityName) => {
    setFormData(prev => ({
      ...prev,
      cities: prev.cities.filter(c => c.name !== cityName)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('عنوان القسم مطلوب');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="department-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <span className="form-icon">📝</span>
        <h3>ادخل البيانات</h3>
      </div>

      {/* عنوان القسم */}
      <div className="form-group">
        <label>عنوان القسم / السفارة</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="أدخل عنوان القسم أو السفارة"
          className="form-input"
        />
      </div>

      {/* المدن */}
      <div className="form-group">
        <label>المدن ({formData.cities.length}/3)</label>

        {/* المدن المضافة */}
        {formData.cities.length > 0 && (
          <div className="added-cities">
            {formData.cities.map((city, index) => (
              <div key={index} className="city-item">
                <span className="city-name">{city.name}</span>
                {city.mapLink && (
                  <a href={city.mapLink} target="_blank" rel="noopener noreferrer" className="city-link">
                    📍
                  </a>
                )}
                <button
                  type="button"
                  className="remove-city-btn"
                  onClick={() => handleRemoveCity(city.name)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* إضافة مدينة جديدة */}
        {formData.cities.length < 3 && (
          <div className="add-city-row">
            <select
              value={newCity.name}
              onChange={(e) => setNewCity(prev => ({ ...prev, name: e.target.value }))}
              className="city-select"
            >
              <option value="">-- اختر المدينة --</option>
              {availableCities.filter(c => !formData.cities.find(fc => fc.name === c)).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <input
              type="url"
              value={newCity.mapLink}
              onChange={(e) => setNewCity(prev => ({ ...prev, mapLink: e.target.value }))}
              placeholder="رابط الموقع على الخريطة"
              className="map-link-input"
            />
            <button
              type="button"
              className="add-city-btn"
              onClick={handleAddCity}
            >
              + إضافة مدينة
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          عودة
        </button>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'جاري الحفظ...' : (department ? 'حفظ التعديلات' : '+ إضافة')}
        </button>
      </div>
    </form>
  );
};

export default DepartmentForm;
