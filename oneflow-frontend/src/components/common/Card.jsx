import React from "react";

const Card = ({ children, className = "", hover = true, glass = false, premium = true, ...props }) => {
  return (
    <div
      className={`
        ${glass ? 'glass-card' : 'bg-white'} 
        rounded-xl shadow-sm border border-gray-200 p-6
        ${hover ? 'hover-lift card-3d transition-all duration-300' : ''}
        ${premium ? 'bg-gradient-to-b from-white to-gray-50' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
