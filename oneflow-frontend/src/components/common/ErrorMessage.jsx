import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-4">
      <div className="flex items-center">
        <AlertCircle className="text-red-400 mr-2" size={20} />
        <div className="flex-1">
          <p className="text-red-700 font-medium">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;

