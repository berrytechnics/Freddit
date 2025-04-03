import { ChangeEvent, InputHTMLAttributes, useState } from 'react';

// Define the props interface for the `Input` component
interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  type?: string;
  label?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string | null;
  success?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  success,
  disabled,
  required,
  className,
  ...props
}: InputProps) => {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Determine actual input type for password visibility toggle
  const actualType = type === 'password' && passwordVisible ? 'text' : type;

  // Base input classes
  const baseInputClasses =
    'w-full px-3 py-2.5 text-sm text-gray-800 bg-white border rounded-md transition-all duration-150 ease-in-out';

  // Conditional classes based on state
  const stateClasses = [
    focused ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300',
    error ? 'border-red-500 ring-2 ring-red-100' : '',
    success ? 'border-green-500 ring-2 ring-green-100' : '',
    disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Type-specific classes
  const typeClasses =
    {
      email: 'pl-7',
      search: 'pl-10',
      range: 'h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
      color: 'h-10 p-1 cursor-pointer',
      file: 'p-2 cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200',
    }[type] || '';

  // Combine all classes
  const inputClasses =
    `${baseInputClasses} ${stateClasses} ${typeClasses} ${className || ''}`.trim();

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);

  // Handler for search clear button
  const handleClearSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onChange) {
      // Create a properly structured synthetic event
      const syntheticEvent = {
        target: {
          value: '',
        },
      } as ChangeEvent<HTMLInputElement>;

      onChange(syntheticEvent);
    }
  };

  return (
    <div className="mb-4 font-sans">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Render different prefixes based on input type */}
        {type === 'email' && (
          <span className="absolute left-3 text-gray-500 pointer-events-none">
            @
          </span>
        )}

        {type === 'search' && (
          <span className="absolute left-3 text-gray-500 pointer-events-none">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </span>
        )}

        <input
          type={actualType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />

        {/* Show password toggle button for password inputs */}
        {type === 'password' && (
          <button
            type="button"
            className="absolute right-3 p-0 bg-transparent border-none cursor-pointer"
            onClick={() => setPasswordVisible(!passwordVisible)}
            tabIndex={-1}
          >
            {passwordVisible ? (
              <svg
                className="w-5 h-5 text-gray-500 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-500 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
              </svg>
            )}
          </button>
        )}

        {/* Show clear button for search inputs */}
        {type === 'search' && value && (
          <button
            type="button"
            className="absolute right-3 text-xl text-gray-500 bg-transparent border-none cursor-pointer"
            onClick={handleClearSearch}
          >
            ×
          </button>
        )}

        {/* Show success icon */}
        {success && !['password', 'search'].includes(type) && (
          <span className="absolute right-3 flex items-center">
            <svg
              className="w-5 h-5 text-green-500 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </span>
        )}
      </div>

      {/* Show error message if present */}
      {error && <div className="mt-1.5 text-xs text-red-500">{error}</div>}
    </div>
  );
};

export default Input;
