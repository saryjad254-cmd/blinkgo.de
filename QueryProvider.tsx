import { requireRole } from '@/lib/rbac';
import { CustomerNav } from '@/components/customer/CustomerNav';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole('customer');
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />
      <main className="pb-20 md:pb-8">{children}</main>
    </div>
  );
}