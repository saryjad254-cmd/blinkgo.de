import { requireRole } from '@/lib/rbac';
import { AdminLayout } from '@/components/AdminLayout';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getDrivers() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, name, email, is_active, last_login_at,
      driver_status:driver_status (
        is_online, is_on_delivery, latitude, longitude, updated_at
      )
    `)
    .eq('role', 'driver')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('getDrivers failed:', error);
    return [];
  }
  return data ?? [];
}

export default async function DriversPage() {
  const user = await requireRole('admin');
  const drivers = await getDrivers();

  const onlineCount = drivers.filter((d: any) => d.driver_status?.is_online).length;
  const deliveringCount = drivers.filter((d: any) => d.driver_status?.is_on_delivery).length;

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">السائقون</h1>
            <p className="text-gray-600 mt-1">
              {drivers.length} سائق — {onlineCount} متصل الآن — {deliveringCount} في توصيل
            </p>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">الاسم</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">الموقع</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">آخر تحديث</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-500">
                      لا يوجد سائقون
                    </td>
                  </tr>
                ) : (
                  drivers.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{d.name}</p>
                        <p className="text-xs text-gray-500" dir="ltr">{d.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {d.driver_status?.is_on_delivery ? (
                          <span className="badge-warning">في توصيل</span>
                        ) : d.driver_status?.is_online ? (
                          <span className="badge-success">متصل</span>
                        ) : (
                          <span className="badge">غير متصل</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600" dir="ltr">
                        {d.driver_status?.latitude ? (
                          <>
                            {Number(d.driver_status.latitude).toFixed(4)}, {Number(d.driver_status.longitude).toFixed(4)}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {d.driver_status?.updated_at
                          ? new Date(d.driver_status.updated_at).toLocaleTimeString('ar-SA')
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