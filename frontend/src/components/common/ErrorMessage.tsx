import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, className = '' }) => {
  return (
    <div
      className={`flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-rose-900">Notice</p>
        <p className="mt-0.5 text-rose-700">{message}</p>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="mt-2.5 border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};
