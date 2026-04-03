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
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('price_per_pound_snapshot', 10, 2)->nullable()->after('subtotal_sbd');
        });

        DB::table('order_items')->update([
            'price_per_pound_snapshot' => DB::raw('(select o.price_per_pound_snapshot from orders o where o.id = order_items.order_id)'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('price_per_pound_snapshot');
        });
    }
};
