import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Credit Transactions | ImgStudio Admin',
};

export default async function AdminTransactionsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/signin');

  const adminCheck = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (adminCheck?.role !== 'ADMIN') redirect('/dashboard');

  const transactions = await prisma.creditTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    take: 100, // Just limiting to latest 100 for now to prevent huge queries
  });

  return (
    <div className='max-w-7xl mx-auto space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-zinc-100'>Credit Transactions</h1>
          <p className='text-zinc-400'>Track all credit usage, addons, and initial signups across the platform.</p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/api/admin/transactions/export" prefetch={false}>
            <Download className="h-4 w-4" />
            Export CSV
          </Link>
        </Button>
      </div>

      <div className='bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden'>
        <Table>
          <TableHeader className='bg-zinc-950/50'>
            <TableRow className='border-zinc-800/50 hover:bg-transparent'>
              <TableHead className='text-zinc-400'>User</TableHead>
              <TableHead className='text-zinc-400'>Type</TableHead>
              <TableHead className='text-zinc-400'>Amount</TableHead>
              <TableHead className='text-zinc-400 w-1/3'>Description</TableHead>
              <TableHead className='text-right text-zinc-400'>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow className='border-zinc-800/50 hover:bg-zinc-800/20'>
                <TableCell colSpan={5} className='text-center py-8 text-zinc-500'>
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id} className='border-zinc-800/50 hover:bg-zinc-800/20'>
                  <TableCell>
                    <div className='font-medium text-zinc-200'>{tx.user.name || 'Anonymous'}</div>
                    <div className='text-xs text-zinc-500'>{tx.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${tx.type === 'USAGE' ? 'border-amber-500/30 text-amber-400' : ''}
                      ${tx.type === 'ADDON' ? 'border-emerald-500/30 text-emerald-400' : ''}
                      ${tx.type === 'INITIAL' ? 'border-blue-500/30 text-blue-400' : ''}
                      ${tx.type === 'ADMIN_UPDATE' ? 'border-purple-500/30 text-purple-400' : ''}
                    `}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono font-medium ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </TableCell>
                  <TableCell className='text-zinc-300 text-sm'>
                    {tx.description || '-'}
                  </TableCell>
                  <TableCell className='text-right text-zinc-400 text-sm whitespace-nowrap'>
                    {formatDistanceToNow(tx.createdAt, { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
