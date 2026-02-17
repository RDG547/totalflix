import { NextResponse } from 'next/server';

const CLICKADILLA_TOKEN = '2b9318b204ed4ab6ba9abd7f5df9d51c';
const CLICKADILLA_BASE_URL = 'https://publishers.clickadilla.com/backend/api/public';

export async function GET() {
    try {
        const response = await fetch(
            `${CLICKADILLA_BASE_URL}/user-spots?token=${CLICKADILLA_TOKEN}`,
            {
                headers: {
                    'Accept': 'application/json',
                },
                next: { revalidate: 3600 }, // Cache por 1 hora
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
        console.error('Error fetching Clickadilla spots:', error);
        return NextResponse.json(
            { error: 'Failed to fetch spots' },
            { status: 500 }
        );
    }
}
