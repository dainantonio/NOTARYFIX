import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md", className)}>
    {children}
  </div>
);

export const CardHeader = ({ children, className }) => (
  <div className={cn("px-6 py-4 border-b border-slate-100 flex items-center justify-between", className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className }) => (
  <h3 className={cn("text-lg font-semibold text-slate-800 tracking-tight", className)}>
    {children}
  </h3>
);

export const CardContent = ({ children, className }) => (
  <div className={cn("p-6", className)}>
    {children}
  </div>
);

export const Button = ({ children, variant = 'primary', size = 'default', className, ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-blue-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent",
    outline: "bg-transparent border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
  };
  
  const sizes = {
    xs: "h-7 px-2 text-xs",
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10 p-2 flex items-center justify-center",
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-red-50 text-red-700 border-red-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", variants[variant], className)}>
      {children}
    </span>
  );
};

export const Progress = ({ value, max = 100, className, indicatorClassName }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-2 w-full bg-slate-100 rounded-full overflow-hidden", className)}>
      <div 
        className={cn("h-full bg-blue-600 transition-all duration-500 ease-out", indicatorClassName)} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export const Select = ({ value, onChange, options, className }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className={cn(
        "appearance-none w-full bg-white border border-slate-200 text-slate-700 py-2 px-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm",
        className
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);
