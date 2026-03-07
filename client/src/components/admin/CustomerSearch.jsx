import { useState, useEffect, useRef, useCallback } from 'react';
import { customersApi } from '../../api';
import { Link } from 'react-router-dom';
import './CustomerSearch.css';

/**
 * مكوّن بحث واختيار عميل مشترك
 * يستخدم في صفحات تفاصيل الطلبات لربط الطلب بعميل من إدارة العملاء
 */
const CustomerSearch = ({ onSelect, currentCustomer, onUnlink, loading: externalLoading }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // بحث مع debounce
  const handleSearch = useCallback((value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await customersApi.searchCustomers(value);
        setResults(res.data?.customers || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleSelect = (customer) => {
    setShowDropdown(false);
    setQuery('');
    setResults([]);
    onSelect(customer._id, customer);
  };

  // عرض العميل المربوط حالياً
  if (currentCustomer) {
    return (
      <div className="customer-search-linked">
        <div className="linked-customer-info">
          <span className="linked-icon">🔗</span>
          <div className="linked-details">
            <Link to={`/control/customers/${currentCustomer._id}`} className="linked-name">
              {currentCustomer.name}
            </Link>
            {currentCustomer.phone && (
              <span className="linked-phone">{currentCustomer.phone}</span>
            )}
          </div>
        </div>
        <button
          className="unlink-btn"
          onClick={onUnlink}
          disabled={externalLoading}
          title="إلغاء الربط"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="customer-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="ابحث عن عميل (اسم، هاتف، رقم هوية)..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="customer-search-input"
        />
        {searching && <span className="search-spinner">⏳</span>}
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="customer-search-dropdown">
          {results.map((customer) => (
            <li
              key={customer._id}
              className="customer-search-item"
              onClick={() => handleSelect(customer)}
            >
              <span className="item-name">{customer.name}</span>
              <span className="item-meta">
                {customer.phone && <span>{customer.phone}</span>}
                {customer.nationalId && <span className="item-id">{customer.nationalId}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && results.length === 0 && !searching && query.length >= 2 && (
        <div className="customer-search-empty">
          لا توجد نتائج
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
