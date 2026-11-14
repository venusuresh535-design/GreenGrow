import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-3',
    lg: 'w-10 h-10 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-2">
      <div
        className={`${sizeMap[size]} border-forest-200 border-t-forest-700 rounded-full animate-spin`}
      />
      {text && <p className="text-xs text-slate-500 font-medium">{text}</p>}
    </div>
  );
};
