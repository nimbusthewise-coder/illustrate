/**
 * Device Management API Route
 * 
 * Handles device registration, listing, and removal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Device } from '@/lib/db/schema/sync';

/**
 * GET /api/sync/devices - List user's devices
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ devices: data });
  } catch (error) {
    console.error('Devices GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync/devices - Register or update a device
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, name, type } = body as {
      deviceId: string;
      name: string;
      type: 'desktop' | 'mobile' | 'tablet' | 'web';
    };

    if (!deviceId || !name || !type) {
      return NextResponse.json(
        { error: 'deviceId, name, and type are required' },
        { status: 400 }
      );
    }

    const device: Partial<Device> = {
      id: deviceId,
      userId: user.id,
      name,
      type,
      lastSyncAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isActive: true,
    };

    const { data, error } = await supabase
      .from('devices')
      .upsert(device)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ device: data });
  } catch (error) {
    console.error('Devices POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sync/devices - Update device last seen
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId } = body as { deviceId: string };

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('devices')
      .update({
        last_seen: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('id', deviceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Devices PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sync/devices - Remove a device
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      );
    }

    // Mark as inactive instead of deleting
    const { error } = await supabase
      .from('devices')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('id', deviceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Devices DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
