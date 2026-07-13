import { NextResponse } from 'next/server';
import { CLICKADILLA_BASE_URL, getClickadillaToken } from '@/lib/clickadilla-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros da query
    const date1 = searchParams.get('date1') || new Date().toISOString().split('T')[0];
    const date2 = searchParams.get('date2') || new Date().toISOString().split('T')[0];
    const fields = searchParams.get('fields') || 'date,impressions,clicks,money';
    const orderBy = searchParams.get('orderBy') || '-date';
    const limit = searchParams.get('limit') || '500';
    const offset = searchParams.get('offset') || '0';
    const filters = searchParams.get('filters') || '';

    try {
        const token = getClickadillaToken();
        // Constrói a URL com os parâmetros
        const params = new URLSearchParams({
            token,
            date1,
            date2,
            fields,
            orderBy,
            limit,
            offset,
        });

        if (filters) {
            params.append('filters', filters);
        }

        const response = await fetch(
            `${CLICKADILLA_BASE_URL}/stats?${params.toString()}`,
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 300 }, // Cache por 5 minutos
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `API responded with status ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching Clickadilla stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
