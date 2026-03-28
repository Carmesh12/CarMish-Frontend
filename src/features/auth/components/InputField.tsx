import React, { type InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, id, ...props }) => {
  return (
    <div className="flex flex-col mb-4">
      <label htmlFor={id} className="mb-2 text-sm font-semibold text-[#1A2238]">
        {label}
      </label>
      <input
        id={id}
        className="px-4 py-3 rounded-md border border-[#E0E0E0] bg-white text-[#1A2238] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent transition-all duration-200"
        {...props}
      />
    </div>
  );
};
