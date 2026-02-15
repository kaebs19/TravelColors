import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}, validate = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors[name]) {
        setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
      }
    }
  }, [values, validate]);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setFormValues = useCallback((newValues) => {
    setValues(newValues);
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const validateForm = useCallback(() => {
    if (!validate) return true;

    const validationErrors = validate(values);
    setErrors(validationErrors);

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    return Object.keys(validationErrors).length === 0;
  }, [values, validate]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValue,
    setFormValues,
    reset,
    validateForm,
    isValid: Object.keys(errors).length === 0
  };
};
