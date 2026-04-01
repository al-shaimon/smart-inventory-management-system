import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardShell userName={session.name} userEmail={session.email}>
      {children}
    </DashboardShell>
  );
}
