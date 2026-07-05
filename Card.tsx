import { requireRole } from '@/lib/rbac';
import { DriverNav } from '@/components/driver/DriverNav';

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole('driver');
  return (
    <div className="min-h-screen bg-gray-50">
      <DriverNav />
      <main className="pb-20 md:pb-8">{children}</main>
    </div>
  );
}