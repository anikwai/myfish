<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('price_per_pound_snapshot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('price_per_pound_snapshot', 10, 2)->nullable();
        });

        $orderIds = DB::table('orders')->pluck('id');

        foreach ($orderIds as $orderId) {
            $snapshot = DB::table('order_items')
                ->where('order_id', $orderId)
                ->value('price_per_pound_snapshot');

            if ($snapshot !== null) {
                DB::table('orders')->where('id', $orderId)->update([
                    'price_per_pound_snapshot' => $snapshot,
                ]);
            }
        }
    }
};
