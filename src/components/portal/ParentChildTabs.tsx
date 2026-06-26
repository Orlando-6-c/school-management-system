'use client';

import { useState } from 'react';
import { Book, FileText, Calendar as CalendarIcon, ClipboardList, CreditCard, Download, Award } from 'lucide-react';
import { format } from 'date-fns';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ParentChildTabs({ data, childName, childClass, childSection, childRollNumber }: any) {
    const [activeTab, setActiveTab] = useState('assignments');

    const tabs = [
        { id: 'ebooks', label: 'E-Books', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-200' },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-200' },
        { id: 'homework', label: 'Homework', icon: Book, color: 'text-indigo-500', bg: 'bg-indigo-500', border: 'border-indigo-200' },
        { id: 'performance', label: 'Performance', icon: Award, color: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-200' },
        { id: 'attendance', label: 'Attendance', icon: CalendarIcon, color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-200' },
        { id: 'fee', label: 'Fee', icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-200' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'ebooks':
                return (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {data.materials.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm bg-white rounded-xl border border-dashed border-emerald-200">No E-Books available currently.</div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {data.materials.map((m: any) => (
                                    <div key={m.id} className="p-4 flex items-center justify-between bg-white border border-emerald-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div>
                                            <div className="font-bold text-sm text-slate-800">{m.title}</div>
                                            <div className="text-xs text-emerald-600 mt-1">{m.subject}</div>
                                        </div>
                                        <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'assignments':
                return (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {data.homeworks.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm bg-white rounded-xl border border-dashed border-blue-200">No assignments mapped.</div>
                        ) : (
                            <div className="grid gap-4">
                                {data.homeworks.map((h: any) => {
                                    const isOverdue = new Date(h.dueDate) < new Date();
                                    return (
                                        <div key={h.id} className="p-4 bg-white border border-blue-100 rounded-xl shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-slate-800">{h.title}</div>
                                                    <div className="text-xs font-semibold text-blue-600 mt-1">{h.subject}</div>
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded font-bold border ${isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                    Due {format(new Date(h.dueDate), 'MMM dd, yyyy')}
                                                </div>
                                            </div>
                                            <p className="text-slate-500 text-sm mt-3">{h.description}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                );
            case 'homework':
                return (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {data.homeworks.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm bg-white rounded-xl border border-dashed border-indigo-200">No active homework pending.</div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {data.homeworks.map((h: any) => {
                                    const isOverdue = new Date(h.dueDate) < new Date();
                                    return (
                                        <div key={h.id} className="p-4 bg-white border border-indigo-100 rounded-xl shadow-sm relative overflow-hidden">
                                            {isOverdue && <div className="absolute top-0 right-0 w-2 h-full bg-red-400" />}
                                            <div className="font-bold text-slate-800 pr-4">{h.title}</div>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{h.subject}</div>
                                                <div className="text-[10px] text-slate-500 font-medium">
                                                    Due: {format(new Date(h.dueDate), 'MMM dd')}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                );
            case 'performance':
                return (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {(!data.examResults || data.examResults.length === 0) ? (
                            <div className="p-8 text-center text-muted-foreground text-sm bg-white rounded-xl border border-dashed border-purple-200">No performance records available.</div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {data.examResults.map((r: any) => (
                                    <div key={r.id} className="p-4 bg-white border border-purple-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">{r.exam.title}</div>
                                                <div className="text-xs text-purple-600 mt-1">{r.subject}</div>
                                            </div>
                                            <div className="font-black text-purple-700">
                                                {Number(r.marksObtained)} / {Number(r.totalMarks)}
                                            </div>
                                        </div>
                                        {r.remarks && <p className="text-xs text-slate-500 mt-2 italic">"{r.remarks}"</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'attendance':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-white p-6 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Attendance Status</span>
                                <span className="text-slate-800 text-sm mt-1">Total recorded presence for this semester</span>
                            </div>
                            <div className={`text-4xl font-black ${data.attendancePercentage >= 75 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {data.attendancePercentage}%
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-amber-50 bg-amber-50/30">
                                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-widest">Weekly Schedule</h3>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <tbody className="divide-y divide-amber-50">
                                        {DAYS.map((day, idx) => {
                                            const daySlots = data.timetables.filter((t: any) => t.dayOfWeek === idx);
                                            if (daySlots.length === 0) return null;
                                            return (
                                                <tr key={idx} className="hover:bg-amber-50/20">
                                                    <td className="px-5 py-3 font-bold text-amber-800 bg-amber-50/50 w-[120px]">{day}</td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {daySlots.map((slot: any) => (
                                                                <div key={slot.id} className="bg-amber-50 border border-amber-100 rounded p-2 min-w-[120px]">
                                                                    <div className="text-[10px] font-bold text-amber-900">{slot.startTime} - {slot.endTime}</div>
                                                                    <div className="text-xs font-bold text-amber-700 mt-0.5">{slot.subject}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 border-t border-amber-100 bg-white">
                                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-widest mb-3">Recent Attendance</h3>
                                <div className="space-y-2">
                                    {data.attendancesList?.map((att: any) => (
                                        <div key={att.id} className="flex justify-between items-center p-2 rounded bg-amber-50/50">
                                            <span className="text-sm font-semibold">{format(new Date(att.date), 'MMM dd, yyyy')}</span>
                                            <span className={`text-xs px-2 py-1 rounded font-bold ${att.isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {att.isPresent ? 'Present' : 'Absent'}
                                            </span>
                                        </div>
                                    ))}
                                    {(!data.attendancesList || data.attendancesList.length === 0) && (
                                        <div className="text-sm text-slate-500">No recent attendance records.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'fee':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Pending Fees Section */}
                        <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm">
                            <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Pending Dues</h3>
                            {!data.feeChallans || data.feeChallans.filter((f: any) => f.status === 'Pending' || f.status === 'Overdue').length === 0 ? (
                                <p className="text-sm text-emerald-600 font-medium pb-2">No pending dues. All clear!</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.feeChallans.filter((f: any) => f.status === 'Pending' || f.status === 'Overdue').map((f: any) => (
                                        <div key={f.id} className="flex justify-between items-center p-3 rounded-lg border border-rose-50 bg-rose-50/30">
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">{f.month} {f.year} - {f.challanNumber}</div>
                                                <div className={`text-xs mt-1 font-semibold ${f.status === 'Overdue' ? 'text-red-500' : 'text-slate-500'}`}>
                                                    Due: {format(new Date(f.dueDate), 'MMM dd, yyyy')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-rose-700">Rs {Number(f.totalAmount).toLocaleString()}</div>
                                                <div className="text-[10px] text-rose-500 uppercase font-bold">{f.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment Accounts Section */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider">Accounts for Payment</h3>
                            {!data.bankAccounts || data.bankAccounts.length === 0 ? (
                                <p className="text-sm text-slate-500">No bank accounts configured. Please contact the school.</p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {data.bankAccounts.map((acc: any) => (
                                        <div key={acc.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">{acc.bankName}</div>
                                            <div className="font-bold text-sm text-slate-800">{acc.accountTitle}</div>
                                            <div className="font-mono text-xs text-slate-600 mt-1">{acc.accountNumber}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">{childName}</h2>
                    <div className="text-muted-foreground font-semibold flex gap-2 items-center mt-2">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">Class {childClass} {childSection}</span>
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-mono">Roll: {childRollNumber}</span>
                    </div>
                </div>
            </div>

            {/* Custom Tap Navigation */}
            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                                ${isActive
                                    ? `${tab.bg} text-white shadow-md transform scale-105`
                                    : `bg-white text-slate-600 hover:bg-slate-50 border ${tab.border} hover:shadow-sm`
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content Area */}
            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
}
