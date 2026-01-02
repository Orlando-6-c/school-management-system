import db from '@/lib/db';
import { getSchools } from '@/actions/school';

export default async function AdminDashboard() {
    const schools = await db.school.count();
    const students = await db.student.count(); // Global count across all schools
    // Revenue is tricky as it's sum of all Income entries or similar. 
    // Let's count Active Schools for now as a quick stat.
    const activeSchools = await db.school.count({ where: { isActive: true } });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">System overview and statistics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Schools</h3>
                    <p className="text-3xl font-bold text-sky-600 mt-2">{schools}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Active Students</h3>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{students}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Active Schools</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{activeSchools}</p>
                </div>
            </div>
        </div>
    );
}
