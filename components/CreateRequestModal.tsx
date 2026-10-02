import React, { useState } from 'react';
import { X, Loader2, Sparkles, FilePlus2, AlertCircle } from 'lucide-react';
import { Persona } from './Navbar';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: Persona;
  onSuccess: (newRequest: any) => void;
  onError: (errorMsg: string) => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  activePersona,
  onSuccess,
  onError,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState<{ title?: string; description?: string }>({});

  if (!isOpen) return null;

  const validate = () => {
    const errors: { title?: string; description?: string } = {};
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      errors.title = 'Title is required';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (trimmedTitle.length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }

    if (!trimmedDesc) {
      errors.description = 'Description is required';
    } else if (trimmedDesc.length < 5) {
      errors.description = 'Description must be at least 5 characters long';
    } else if (trimmedDesc.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setClientErrors({});

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activePersona.id,
          'x-user-role': activePersona.role,
          'x-user-name': activePersona.name,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const fieldErrors: { title?: string; description?: string } = {};
          if (data.details.title?.[0]) fieldErrors.title = data.details.title[0];
          if (data.details.description?.[0]) fieldErrors.description = data.details.description[0];
          setClientErrors(fieldErrors);
        }
        throw new Error(data.error || 'Failed to create request');
      }

      // Reset and notify success
      setTitle('');
      setDescription('');
      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      onError(err.message || 'An error occurred while creating the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <FilePlus2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">New Request Proposal</h3>
              <p className="text-xs text-slate-500">Initiated by {activePersona.name} (Creator)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="req-title" className="text-xs font-semibold text-slate-700">
                Request Title <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  title.length > 100 ? 'text-rose-500 font-bold' : 'text-slate-400'
                }`}
              >
                {title.length}/100
              </span>
            </div>
            <input
              id="req-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (clientErrors.title) setClientErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g. Q1 Infrastructure Scale Upgrade"
              maxLength={120}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                clientErrors.title
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-slate-900'
              }`}
            />
            {clientErrors.title && (
              <p className="flex items-center gap-1 mt-1 text-xs text-rose-600">
                <AlertCircle className="w-3.5 h-3.5" />
                {clientErrors.title}
              </p>
            )}
          </div>

          {/* Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="req-desc" className="text-xs font-semibold text-slate-700">
                Justification & Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  description.length > 500 ? 'text-rose-500 font-bold' : 'text-slate-400'
                }`}
              >
                {description.length}/500
              </span>
            </div>
            <textarea
              id="req-desc"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (clientErrors.description)
                  setClientErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder="Outline the operational necessity, estimated cost impact, and implementation timeline..."
              maxLength={550}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 resize-none transition-colors ${
                clientErrors.description
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-slate-900'
              }`}
            />
            {clientErrors.description && (
              <p className="flex items-center gap-1 mt-1 text-xs text-rose-600">
                <AlertCircle className="w-3.5 h-3.5" />
                {clientErrors.description}
              </p>
            )}
          </div>

          {/* Policy Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Governance Notice:</span> New proposals are
            created in <span className="font-mono font-medium text-slate-700">DRAFT</span> status. You
            can edit or submit it for formal review anytime before work begins.
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <span>Save as Draft</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
