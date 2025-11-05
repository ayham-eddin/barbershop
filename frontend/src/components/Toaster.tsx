// src/components/Toaster.tsx
import { Toaster } from 'react-hot-toast';

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        // keep it subtle and consistent with your UI
        duration: 3000,
        style: {
          fontSize: '0.9rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',     // neutral-200
          background: '#ffffff',
          color: '#111827',                 // neutral-900
        },
        success: {
          // (optional) you can tweak success-specific styles here
        },
        error: {
          // (optional) you can tweak error-specific styles here
        },
      }}
    />
  );
}
