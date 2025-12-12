import { NextResponse } from 'next/server';
import { openRouterService } from '@/lib/openrouter';

export async function GET() {
  try {
    const models = await openRouterService.getFreeModels();
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
