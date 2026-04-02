<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $orders = DB::table('orders')
            ->whereNotIn('id', DB::table('order_status_logs')->select('order_id'))
            ->get(['id', 'status', 'created_at', 'updated_at']);

        $logs = [];

        foreach ($orders as $order) {
            $logs[] = [
                'order_id' => $order->id,
                'status' => 'placed',
                'user_id' => null,
                'created_at' => $order->created_at,
            ];

            if ($order->status !== 'placed') {
                $logs[] = [
                    'order_id' => $order->id,
                    'status' => $order->status,
                    'user_id' => null,
                    'created_at' => $order->updated_at,
                ];
            }
        }

        if (! empty($logs)) {
            DB::table('order_status_logs')->insert($logs);
        }
    }

    public function down(): void
    {
        // Forward-only migration — backfilled rows cannot be distinguished from real ones
    }
};
