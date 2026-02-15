import { useState, useEffect } from 'react';
import { arabicToEnglishNumbers, normalizePhoneNumber } from '../../utils/formatters';

/**
 * مكون إدخال رقم الهاتف مع دعم الأرقام العربية
 * يحول تلقائياً الأرقام العربية إلى إنجليزية
 * يعرض الرقم بتنسيق سعودي: 05XX XXX XXXX
 */
const PhoneInput = ({
  value,
  onChange,
  onBlur,
  placeholder = '05XX XXX XXXX',
  className = '',
  disabled = false,
  required = false,
  name,
  id,
  style = {},
  showFlag = true,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // تنسيق رقم الهاتف للعرض
  const formatForDisplay = (phone) => {
    if (!phone) return '';
    const cleaned = normalizePhoneNumber(phone);

    // تنسيق سعودي: 05XX XXX XXXX
    if (cleaned.length <= 4) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    } else {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
    }
  };

  // تحديث القيمة المعروضة عند تغيير value من الخارج
  useEffect(() => {
    if (value) {
      setDisplayValue(formatForDisplay(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    let inputValue = e.target.value;

    // تحويل الأرقام العربية للإنجليزية
    inputValue = arabicToEnglishNumbers(inputValue);

    // إزالة كل شيء غير الأرقام والمسافات
    const cleanedValue = inputValue.replace(/[^0-9]/g, '');

    // الحد الأقصى 10 أرقام للسعودية
    const limitedValue = cleanedValue.slice(0, 10);

    // تنسيق للعرض
    setDisplayValue(formatForDisplay(limitedValue));

    // إرسال القيمة النظيفة (بدون مسافات)
    if (onChange) {
      onChange({
        target: {
          name,
          value: limitedValue
        }
      });
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      const cleanedValue = normalizePhoneNumber(displayValue);
      onBlur({
        target: {
          name,
          value: cleanedValue
        }
      });
    }
  };

  return (
    <div className={`phone-input-wrapper ${className}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', ...style }}>
      {showFlag && (
        <span className="phone-input-flag" style={{
          position: 'absolute',
          right: '10px',
          fontSize: '16px',
          pointerEvents: 'none'
        }}>
          🇸🇦
        </span>
      )}
      <input
        type="tel"
        inputMode="tel"
        dir="ltr"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        id={id}
        className="phone-input"
        style={{
          textAlign: 'left',
          paddingRight: showFlag ? '35px' : undefined,
          width: '100%'
        }}
        {...props}
      />
    </div>
  );
};

export default PhoneInput;
