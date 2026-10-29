import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Last-resort safety net: a render crash shows a message instead of a blank screen. */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('UI crashed:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-[#080705] text-[#F7F2E8] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4 rounded-2xl border border-[#C9A45C]/55 bg-[#14100A] p-8">
          <h1 className="text-xl font-bold text-[#FCE694]">เกิดข้อผิดพลาดบนหน้านี้</h1>
          <p className="text-sm text-[#F7F2E8]/80 leading-relaxed">
            ขออภัย ระบบแสดงผลหน้านี้ไม่สำเร็จ กรุณาลองโหลดหน้าใหม่ หากยังพบปัญหา กรุณาลองอีกครั้งในภายหลัง
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-sacred-gold w-full min-h-[48px] px-6 py-3 rounded-xl font-bold"
          >
            โหลดหน้าใหม่
          </button>
        </div>
      </div>
    );
  }
}
