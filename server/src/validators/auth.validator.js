const validateRegister = (data = {}) => {
  const errors = {};

  // Email validation
  if (!data.email) {
    errors.email = "Email is required";
  } else if (
    typeof data.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    errors.email = "Please provide a valid email address";
  }

  // Password validation
  if (!data.password) {
    errors.password = "Password is required";
  } else if (
    typeof data.password !== "string" ||
    data.password.length < 6
  ) {
    errors.password = "Password must be at least 6 characters";
  }

  // Name validation
  if (data.name !== undefined && data.name !== null) {
    if (typeof data.name !== "string") {
      errors.name = "Name must be a string";
    } else if (data.name.trim().length > 100) {
      errors.name = "Name must not exceed 100 characters";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateLogin = (data = {}) => {
  const errors = {};

  // Email validation
  if (!data.email) {
    errors.email = "Email is required";
  } else if (
    typeof data.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    errors.email = "Please provide a valid email address";
  }

  // Password validation
  if (!data.password) {
    errors.password = "Password is required";
  } else if (typeof data.password !== "string") {
    errors.password = "Password must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateRegister,
  validateLogin,
};