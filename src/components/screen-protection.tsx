
"use client";

import { useEffect, type ReactNode } from 'react';

interface ScreenProtectionProps {
    children: ReactNode;
}

export function ScreenProtection({ children }: ScreenProtectionProps) {

  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable text selection and other callouts
    const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    const bodyStyle = document.body.style;
    bodyStyle.userSelect = 'none';
    bodyStyle.webkitUserSelect = 'none';
    bodyStyle.webkitTouchCallout = 'none';


    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      bodyStyle.userSelect = '';
      bodyStyle.webkitUserSelect = '';
      bodyStyle.webkitTouchCallout = '';
    };
  }, []);
  
  return (
    <>
      {children}
      <div id="print-block-message" className="hidden">
        Mencetak atau menyimpan halaman ini tidak diizinkan untuk melindungi hak cipta.
      </div>
    </>
  );
}
