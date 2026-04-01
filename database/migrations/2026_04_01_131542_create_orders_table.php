<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_name')->nullable();
            $table->string('guest_phone')->nullable();
            $table->string('status')->default('placed')->index();
            $table->decimal('price_per_pound_snapshot', 10, 2);
            $table->decimal('filleting_fee_snapshot', 10, 2);
            $table->decimal('delivery_fee_snapshot', 10, 2);
            $table->boolean('filleting')->default(false);
            $table->boolean('delivery')->default(false);
            $table->string('delivery_location')->nullable();
            $table->decimal('total_sbd', 10, 2);
            $table->string('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
