import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';
import { Book, Download, Calendar as CalendarIcon, FileText } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function StudentPortalPage() {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'Student') redirect('/login');

    const user = await db.user.findFirst({
        where: { id: session.userId! },
        include: { student: { include: { class: true } } }
    });

    if (!user || !user.student) return <div className="p-8 text-destructive">Student profile mapping explicitly missing.</div>;
    const student = user.student;
    if (!student.classId) return <div className="p-8 text-destructive">Student is not assigned to any class.</div>;

    // Fetch Academic Resources
    const timetables = await db.timetable.findMany({
        where: { classId: student.classId },
        include: { teacher: true },
        orderBy: { startTime: 'asc' }
    });

    const homeworks = await db.homework.findMany({
        where: { classId: student.classId },
        include: { teacher: true },
        orderBy: { dueDate: 'asc' }
    });

    const materials = await db.studyMaterial.findMany({
        where: { OR: [{ classId: student.classId }, { classId: null }], schoolId: session.schoolId },
        include: { teacher: true },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    // Attendance Stats
    const totalAttendance = await db.attendance.count({ where: { studentId: student.id } });
    const presentCount = await db.attendance.count({ where: { studentId: student.id, isPresent: true } });
    const attendancePercentage = totalAttendance === 0 ? 100 : Math.round((presentCount / totalAttendance) * 100);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <header className="bg-white p-8 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {student.name}!</h1>
                    <p className="text-muted-foreground mt-2">Class: {student.class.name} {student.class.section ? `(${student.class.section})` : ''} &bull; Roll No: {student.rollNumber}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center min-w-[150px]">
                    <div className="text-sm font-semibold text-indigo-900 uppercase tracking-widest">Attendance</div>
                    <div className={`text-4xl font-black mt-2 ${attendancePercentage >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {attendancePercentage}%
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Homework */}
                <section className="space-y-4 shadow-sm border border-border bg-white rounded-xl overflow-hidden text-foreground">
                    <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center"><Book className="w-5 h-5 mr-2 text-indigo-600" /> Pending Homework</h2>
                    </div>
                    <div className="p-0">
                        {homeworks.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">You have no pending homework. Great job!</div>
                        ) : (
                            <div className="divide-y divide-border">
                                {homeworks.map(h => {
                                    const isOverdue = new Date(h.dueDate) < new Date();
                                    return (
                                        <div key={h.id} className="p-5 hover:bg-muted/20 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg">{h.title}</h3>
                                                    <div className="text-sm font-semibold text-indigo-700 mt-1">{h.subject} &bull; <span className="text-muted-foreground font-normal">{h.teacher.firstName} {h.teacher.lastName}</span></div>
                                                </div>
                                                <div className={`text-xs px-3 py-1 rounded-full font-bold border ${isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                                    Due {format(new Date(h.dueDate), 'MMM dd')}
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground text-sm mt-3">{h.description}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Study Materials */}
                <section className="space-y-4 shadow-sm border border-border bg-white rounded-xl overflow-hidden text-foreground">
                    <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center"><FileText className="w-5 h-5 mr-2 text-emerald-600" /> Study Materials</h2>
                    </div>
                    <div className="p-0 max-h-[500px] overflow-y-auto">
                        {materials.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No study materials available.</div>
                        ) : (
                            <div className="divide-y divide-border">
                                {materials.map(m => (
                                    <div key={m.id} className="p-5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                        <div>
                                            <h3 className="font-bold">{m.title}</h3>
                                            <div className="text-sm text-emerald-700 mt-1">{m.subject} &bull; <span className="text-muted-foreground">{m.teacher.firstName}</span></div>
                                        </div>
                                        <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                                            <Download className="w-5 h-5" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Timetable Matrix */}
            <section className="space-y-4 shadow-sm border border-border bg-white rounded-xl overflow-hidden text-foreground">
                <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center"><CalendarIcon className="w-5 h-5 mr-2 text-amber-600" /> Weekly Timetable</h2>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted px-4 py-3 border-b border-border font-medium">
                            <tr>
                                <th className="px-6 py-4 min-w-[150px]">Day</th>
                                <th className="px-6 py-4">Schedule</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {DAYS.map((day, idx) => {
                                const daySlots = timetables.filter(t => t.dayOfWeek === idx);
                                if (daySlots.length === 0) return null;

                                return (
                                    <tr key={idx} className="hover:bg-muted/20">
                                        <td className="px-6 py-4 font-bold text-foreground">{day}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-3">
                                                {daySlots.map(slot => (
                                                    <div key={slot.id} className="bg-amber-50 border border-amber-100 rounded-lg p-3 min-w-[140px]">
                                                        <div className="text-xs font-semibold text-amber-900">{slot.startTime} - {slot.endTime}</div>
                                                        <div className="text-sm font-bold text-amber-700 mt-1">{slot.subject}</div>
                                                        <div className="text-xs text-amber-600 truncate max-w-[120px]">{slot.teacher.firstName} {slot.teacher.lastName}</div>
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
            </section>
        </div>
    );
}
