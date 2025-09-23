import { NextRequest, NextResponse } from 'next/server';
import { getAllCreditPackages, getAllSubscriptionPlans } from '@/models/payment';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'credits' or 'subscriptions'

    if (type === 'credits') {
      const packages = await getAllCreditPackages();
      return NextResponse.json({
        success: true,
        data: packages
      });
    } else if (type === 'subscriptions') {
      const plans = await getAllSubscriptionPlans();
      return NextResponse.json({
        success: true,
        data: plans
      });
    } else {
      // 返回所有定价信息
      const [packages, plans] = await Promise.all([
        getAllCreditPackages(),
        getAllSubscriptionPlans()
      ]);

      return NextResponse.json({
        success: true,
        data: {
          creditPackages: packages,
          subscriptionPlans: plans
        }
      });
    }

  } catch (error) {
    console.error('Get pricing error:', error);
    return NextResponse.json({
      error: 'Failed to get pricing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}