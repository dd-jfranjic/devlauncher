import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ApiTokenModalProps {
  serverName: string;
  placeholder: string;
  onConfirm: (token: string) => void;
  onCancel: () => void;
}

export const ApiTokenModal: React.FC<ApiTokenModalProps> = ({
  serverName,
  placeholder,
  onConfirm,
  onCancel
}) => {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onConfirm(token.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1c1c1c] border border-zinc-800 rounded-lg p-6 w-[500px] shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">API Token Required</h2>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-zinc-400 text-sm mb-4">
          {serverName} requires an API token to function properly. 
          Please enter your API token below:
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 
                     placeholder-zinc-500 focus:outline-none focus:border-blue-500 mb-4"
            autoFocus
          />
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!token.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Install with Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};