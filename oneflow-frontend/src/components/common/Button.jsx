import React from "react";

const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  className = "",
  ...props
}) => {
  const baseStyles =
    "font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95";

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500",
    secondary:
      "bg-white/80 backdrop-blur border-2 border-gray-200 text-gray-900 hover:bg-white focus:ring-gray-400 shadow-sm",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md hover:shadow-lg",
    outline:
      "border-2 border-transparent text-gray-900 bg-white hover:bg-gray-50 focus:ring-blue-400 shadow-sm hover:shadow-md",
    ghost:
      "bg-transparent text-gray-900 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
