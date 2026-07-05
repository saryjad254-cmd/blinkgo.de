import { requireRole } from '@/lib/rbac';
import { AdminLayout } from '@/components/AdminLayout';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getUsers() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_active, is_verified, created_at, last_login_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('getUsers failed:', error);
    return [];
  }
  return data ?? [];
}

export default async function UsersPage() {
  const user = await requireRole('admin');
  const users = await getUsers();

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">المستخدمون</h1>
            <p className="text-gray-600 mt-1">{users.length} مستخدم</p>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">الاسم</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">البريد</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">الدور</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">آخر دخول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      لا يوجد مستخدمون
                    </td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600" dir="ltr">{u.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="badge-success">نشط</span>
                        ) : (
                          <span className="badge-danger">معطل</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleString('ar-SA')
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    customer: { label: 'عميل', cls: 'badge-info' },
    driver: { label: 'سائق', cls: 'badge-warning' },
    restaurant: { label: 'مطعم', cls: 'badge-success' },
    admin: { label: 'مدير', cls: 'badge-danger' },
  };
  const { label, cls } = map[role] ?? { label: role, cls: 'badge' };
  return <span className={cls}>{label}</span>;
}