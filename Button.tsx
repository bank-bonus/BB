import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ad';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-4 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] active:translate-y-1 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center relative overflow-hidden";
  
  const variants = {
    // Yandex Yellow with a darker bottom border for 3D effect
    primary: "bg-gradient-to-b from-[#FCE000] to-[#f5da00] text-black border-b-4 border-[#d4bc00] hover:brightness-105 active:border-b-0", 
    
    // Clean gray
    secondary: "bg-gray-100 text-black border-b-4 border-gray-200 hover:bg-gray-200 active:border-b-0",
    
    // Red/Danger
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
    
    // Green/Success
    success: "bg-gradient-to-b from-green-500 to-green-600 text-white border-b-4 border-green-700 hover:brightness-105 active:border-b-0",
    
    // Outline
    outline: "border-2 border-gray-200 bg-white text-black hover:bg-gray-50",

    // Ad/Video Button
    ad: "bg-gradient-to-b from-violet-500 to-violet-600 text-white border-b-4 border-violet-800 hover:brightness-110 active:border-b-0 shadow-lg shadow-violet-200"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};