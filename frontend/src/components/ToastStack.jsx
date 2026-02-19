// Toast stack for foreground FCM messages.
const ToastStack = ({ toasts, onDismiss }) => {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-stack" role="status" aria-live="polite" aria-relevant="additions text">
      {toasts.map((toast) => {
        const media = toast.image || toast.icon;

        return (
          <div className="toast" key={toast.id} role="status">
            <div className="toast-header">
              <div className="toast-meta">
                {media ? (
                  <div className="toast-media">
                    <img src={media} alt="" />
                  </div>
                ) : null}
                <div>
                  <div className="toast-title">{toast.title}</div>
                  {toast.body ? <div className="toast-body">{toast.body}</div> : null}
                </div>
              </div>
              <button
                type="button"
                className="toast-close"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastStack;
