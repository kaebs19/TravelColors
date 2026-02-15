// التحقق من البريد الإلكتروني
export const isValidEmail = (email) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

// التحقق من رقم الهاتف السعودي
export const isValidSaudiPhone = (phone) => {
  const regex = /^(05|5)(0|3|4|5|6|7|8|9)[0-9]{7}$/;
  const cleaned = phone.replace(/\D/g, '');
  return regex.test(cleaned);
};

// التحقق من رقم الهوية السعودي
export const isValidNationalId = (id) => {
  const regex = /^[12][0-9]{9}$/;
  return regex.test(id);
};

// التحقق من كلمة المرور
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Validation helper للنماذج
export const createValidator = (rules) => {
  return (values) => {
    const errors = {};

    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = values[field];

      for (const rule of fieldRules) {
        if (rule.required && !value) {
          errors[field] = rule.message || 'هذا الحقل مطلوب';
          break;
        }

        if (rule.minLength && value && value.length < rule.minLength) {
          errors[field] = rule.message || `يجب أن يكون ${rule.minLength} أحرف على الأقل`;
          break;
        }

        if (rule.maxLength && value && value.length > rule.maxLength) {
          errors[field] = rule.message || `يجب أن لا يتجاوز ${rule.maxLength} حرف`;
          break;
        }

        if (rule.pattern && value && !rule.pattern.test(value)) {
          errors[field] = rule.message || 'القيمة غير صالحة';
          break;
        }

        if (rule.validate && value) {
          const isValid = rule.validate(value, values);
          if (!isValid) {
            errors[field] = rule.message || 'القيمة غير صالحة';
            break;
          }
        }
      }
    });

    return errors;
  };
};
