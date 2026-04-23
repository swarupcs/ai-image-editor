import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/auth-guard';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();

    const transactions = await prisma.creditTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    const headers = ['ID', 'User Email', 'User Name', 'Amount', 'Type', 'Description', 'Date'];
    
    const csvRows = [headers.join(',')];

    for (const tx of transactions) {
      const row = [
        tx.id,
        `"${tx.user?.email || 'Unknown'}"`,
        `"${tx.user?.name || 'Unknown'}"`,
        tx.amount,
        tx.type,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.createdAt.toISOString(),
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to export transactions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
