import React, { useState } from "react";

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
  name,
  className = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors duration-200">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-3 bg-gray-50 border-2 rounded-xl 
            focus:outline-none focus:ring-2 transition-all duration-300 
            text-gray-900 placeholder-gray-400
            ${isFocused ? 'transform -translate-y-0.5' : ''}
            ${
              error 
                ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                : "border-gray-200 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300"
            } 
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 animate-slide-in">{error}</p>
      )}
    </div>
  );
};

export default Input;
