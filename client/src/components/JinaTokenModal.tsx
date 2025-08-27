import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../stores/useStore';

interface JinaTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentToken?: string;
}

const JinaTokenModal: React.FC<JinaTokenModalProps> = ({ isOpen, onClose, currentToken }) => {
  const [token, setToken] = useState(currentToken || '');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      showToast({ type: 'error', message: 'Please enter a valid Jina API token' });
      return;
    }

    setIsLoading(true);
    try {
      // Call new Jina token API endpoint
      const response = await fetch('http://127.0.0.1:9976/api/system/jina/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        showToast({ 
          type: 'success', 
          message: result.data.message || 'Jina MCP token updated successfully!' 
        });
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update token');
      }
    } catch (error) {
      showToast({ 
        type: 'error', 
        message: 'Failed to update Jina MCP token. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20"
      style={{ zIndex: 2147483647 }} // Maximum z-index value
    >
      <div 
        className="relative bg-neutral-900 border border-neutral-700 rounded-lg p-6 w-full max-w-md mx-4 my-4"
        style={{ zIndex: 2147483647 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">🧠 Jina MCP Token</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              API Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="jina_..."
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-400 mt-1">
              Enter your Jina API token. You have 10M tokens per key.
            </p>
          </div>

          <div className="text-xs text-neutral-400 space-y-1">
            <p>• Get your token from <a href="https://jina.ai/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">jina.ai/api</a></p>
            <p>• Each token provides 10,000,000 requests</p>
            <p>• Token format: jina_xxxxxxxxxxxx</p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && (
                <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full" />
              )}
              {isLoading ? 'Updating...' : 'Update Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default JinaTokenModal;