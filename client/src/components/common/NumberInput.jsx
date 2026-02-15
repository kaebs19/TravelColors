import { useState, useEffect } from 'react';
import { arabicToEnglishNumbers, parseArabicNumber } from '../../utils/formatters';

/**
 * مكون إدخال الأرقام مع دعم الأرقام العربية
 * يحول تلقائياً الأرقام العربية إلى إنجليزية
 */
const NumberInput = ({
  value,
  onChange,
  onBlur,
  placeholder = '',
  className = '',
  min,
  max,
  step = 1,
  allowDecimal = true,
  allowNegative = false,
  prefix = '',
  suffix = '',
  disabled = false,
  required = false,
  name,
  id,
  style = {},
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // تحديث القيمة المعروضة عند تغيير value من الخارج
  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      setDisplayValue(value.toString());
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    let inputValue = e.target.value;

    // تحويل الأرقام العربية للإنجليزية
    inputValue = arabicToEnglishNumbers(inputValue);

    // السماح بالنقطة للأرقام العشرية
    let pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
    if (allowNegative) {
      pattern = allowDecimal ? /[^0-9.-]/g : /[^0-9-]/g;
    }

    // إزالة الأحرف غير المسموحة
    inputValue = inputValue.replace(pattern, '');

    // التأكد من نقطة عشرية واحدة فقط
    if (allowDecimal) {
      const parts = inputValue.split('.');
      if (parts.length > 2) {
        inputValue = parts[0] + '.' + parts.slice(1).join('');
      }
    }

    // التأكد من علامة سالب واحدة فقط في البداية
    if (allowNegative && inputValue.includes('-')) {
      const isNegative = inputValue.startsWith('-') || inputValue.indexOf('-') === 0;
      inputValue = inputValue.replace(/-/g, '');
      if (isNegative) {
        inputValue = '-' + inputValue;
      }
    }

    setDisplayValue(inputValue);

    // إرسال القيمة الرقمية
    if (onChange) {
      const numValue = inputValue === '' || inputValue === '-' ? '' : parseFloat(inputValue);
      onChange({
        target: {
          name,
          value: numValue
        }
      });
    }
  };

  const handleBlur = (e) => {
    let numValue = parseArabicNumber(displayValue);

    // تطبيق الحد الأدنى والأقصى
    if (min !== undefined && numValue < min) {
      numValue = min;
    }
    if (max !== undefined && numValue > max) {
      numValue = max;
    }

    // تحديث القيمة المعروضة
    if (displayValue !== '' && displayValue !== '-') {
      setDisplayValue(numValue.toString());
    }

    if (onBlur) {
      onBlur({
        target: {
          name,
          value: numValue
        }
      });
    }

    if (onChange && (min !== undefined || max !== undefined)) {
      onChange({
        target: {
          name,
          value: numValue
        }
      });
    }
  };

  return (
    <div className={`number-input-wrapper ${className}`} style={{ position: 'relative', ...style }}>
      {prefix && <span className="number-input-prefix">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        dir="ltr"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        id={id}
        className="number-input"
        style={{
          textAlign: 'left',
          paddingLeft: prefix ? '30px' : undefined,
          paddingRight: suffix ? '40px' : undefined,
        }}
        {...props}
      />
      {suffix && <span className="number-input-suffix">{suffix}</span>}
    </div>
  );
};

export default NumberInput;
