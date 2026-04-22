import { prisma } from '@/lib/prisma';
import { UserActions } from './user-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export const metadata = { title: 'Manage Users | Admin Panel' };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { images: true },
      },
    },
  });

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-zinc-100'>Users</h1>
        <p className='text-zinc-400'>Manage users, roles, and credit balances.</p>
      </div>

      <div className='bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden'>
        <Table>
          <TableHeader className='bg-zinc-950/50'>
            <TableRow className='border-zinc-800/50 hover:bg-transparent'>
              <TableHead className='text-zinc-400'>User</TableHead>
              <TableHead className='text-zinc-400'>Role</TableHead>
              <TableHead className='text-zinc-400'>Credits</TableHead>
              <TableHead className='text-zinc-400'>Images Gen.</TableHead>
              <TableHead className='text-zinc-400'>Joined</TableHead>
              <TableHead className='text-right text-zinc-400'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow className='border-zinc-800/50 hover:bg-zinc-800/20'>
                <TableCell colSpan={6} className='text-center py-8 text-zinc-500'>
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className='border-zinc-800/50 hover:bg-zinc-800/20'>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0'>
                        {user.image ? (
                          <Image src={user.image} alt={user.name || ''} width={32} height={32} />
                        ) : (
                          <span className='text-xs font-bold text-zinc-500'>
                            {(user.name?.[0] || user.email[0]).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className='min-w-0'>
                        <div className='font-medium text-zinc-200 truncate'>{user.name || 'Anonymous'}</div>
                        <div className='text-xs text-zinc-500 truncate'>{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'ADMIN' ? (
                      <Badge className='bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'>Admin</Badge>
                    ) : (
                      <Badge className='bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'>User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1.5'>
                      <span className={`font-mono ${user.credits > 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {user.credits}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-zinc-400 font-mono'>
                    {user._count.images}
                  </TableCell>
                  <TableCell className='text-zinc-400 text-sm'>
                    {user.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    <UserActions
                      user={{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        credits: user.credits,
                      }}
                    />
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