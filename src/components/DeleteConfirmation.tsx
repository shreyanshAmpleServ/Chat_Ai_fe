import { X } from "lucide-react";

interface ConfirmationProps {
  isPending: boolean;
  confirmOpen: any;
  target: any;
  closeConfirm: any;
  handleConfirmDelete: any;
}

export const DeleteConfirmation = ({
  confirmOpen,
  closeConfirm,
  target,
  handleConfirmDelete,
  isPending,
}: ConfirmationProps) => {
  return (
    confirmOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={closeConfirm}
        />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header with accent */}
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-5 border-b border-red-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Delete Conversation
                  </h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    This action is permanent
                  </p>
                </div>
              </div>
              <button
                onClick={closeConfirm}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white/50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <p className="text-slate-700 leading-relaxed">
              {target?.title ? (
                <>
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                    {target.title}
                  </span>
                  . This conversation and all its messages will be lost forever.
                </>
              ) : (
                "This conversation and all its messages will be permanently deleted and cannot be recovered."
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={closeConfirm}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Deleting...
                </span>
              ) : (
                "Delete Conversation"
              )}
            </button>
          </div>
        </div>
      </div>
    )
  );
};
