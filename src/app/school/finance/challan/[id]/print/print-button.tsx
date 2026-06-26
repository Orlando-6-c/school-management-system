'use client';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-700"
        >
            Print
        </button>
    );
}
