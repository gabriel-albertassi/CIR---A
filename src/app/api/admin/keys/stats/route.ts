import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // 1. Total Chaves Hoje
    const keysToday = await prisma.authorizationKey.count({
      where: {
        created_at: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    // 2. Total Chaves Mes (TC vs RNM)
    const monthStats = await prisma.authorizationKey.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      where: {
        created_at: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // 3. Distribuição por Origem (Top 5)
    const originStats = await prisma.authorizationKey.groupBy({
      by: ['origin'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // 4. Atividade Recente
    const recentActivity = await prisma.authorizationKey.findMany({
      take: 10,
      orderBy: {
        created_at: 'desc'
      },
      select: {
        id: true,
        key: true,
        patient: true,
        type: true,
        origin: true,
        created_at: true,
        status: true
      }
    });

    return NextResponse.json({
      summary: {
        today: keysToday,
        month: monthStats.reduce((acc, curr) => acc + curr._count.id, 0),
        tc_month: monthStats.find(s => s.type === 'TC')?._count.id || 0,
        rnm_month: monthStats.find(s => s.type === 'RNM')?._count.id || 0
      },
      origins: originStats,
      recent: recentActivity
    });
  } catch (error) {
    console.error('Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
