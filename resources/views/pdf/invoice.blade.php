<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice #{{ $order->id }}</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .business-name { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .business-details { color: #555; font-size: 12px; line-height: 1.6; }
    .document-title { text-align: right; }
    .document-title h1 { font-size: 28px; font-weight: 700; color: #111; letter-spacing: 1px; text-transform: uppercase; }
    .document-title .doc-number { font-size: 13px; color: #555; margin-top: 4px; }
    .divider { border: none; border-top: 1px solid #e5e5e5; margin: 24px 0; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .meta-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 6px; }
    .meta-block p { font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead { background: #f5f5f5; }
    th { padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th.right, td.right { text-align: right; }
    td { padding: 9px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .totals-row.divider-row { border-top: 1px solid #e5e5e5; margin-top: 6px; padding-top: 8px; font-weight: 700; font-size: 14px; }
    .discount { color: #16a34a; }
    .note-section { margin-top: 28px; padding: 12px 16px; background: #f9f9f9; border-radius: 4px; }
    .note-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 4px; }
    .footer { margin-top: 48px; font-size: 11px; color: #aaa; text-align: center; }
</style>
</head>
<body>

<div class="header">
    <div>
        @if($business->logo_url)
        <img src="{{ $business->logo_url }}" alt="{{ $business->name }}" style="height: 52px; width: auto; object-fit: contain; margin-bottom: 8px; display: block;">
        @endif
        <div class="business-name">{{ $business->name }}</div>
        <div class="business-details">
            @if($business->address)<div>{{ $business->address }}</div>@endif
            @if($business->phone)<div>{{ $business->phone }}</div>@endif
            @if($business->email)<div>{{ $business->email }}</div>@endif
        </div>
    </div>
    <div class="document-title">
        <h1>Invoice</h1>
        <div class="doc-number">#{{ $order->id }}</div>
        <div class="doc-number">{{ $order->created_at->format('d M Y') }}</div>
    </div>
</div>

<hr class="divider">

<div class="meta">
    <div class="meta-block">
        <h3>Bill to</h3>
        <p>
            {{ $order->customerName() }}<br>
            @if($order->guest_phone)<span>{{ $order->guest_phone }}</span><br>@endif
            @if($order->guest_email)<span>{{ $order->guest_email }}</span>@endif
            @if($order->user?->email)<span>{{ $order->user->email }}</span>@endif
        </p>
    </div>
    <div class="meta-block" style="text-align:right">
        <h3>Order details</h3>
        <p>
            Status: {{ ucfirst(str_replace('_', ' ', $order->status)) }}<br>
            @if($order->delivery && $order->delivery_location)
                Delivery: {{ $order->delivery_location }}
            @else
                Pickup
            @endif
        </p>
    </div>
</div>

<table>
    <thead>
        <tr>
            <th>Fish type</th>
            <th class="right">Qty (kg)</th>
            <th class="right">Qty (lbs)</th>
            <th class="right">Rate (SBD/lb)</th>
            <th class="right">Subtotal (SBD)</th>
        </tr>
    </thead>
    <tbody>
        @foreach($order->items as $item)
        <tr>
            <td>{{ $item->fishType->name }}</td>
            <td class="right">{{ number_format($item->quantity_kg, 3) }}</td>
            <td class="right">{{ number_format($item->quantity_pounds, 3) }}</td>
            <td class="right">{{ number_format($item->price_per_pound_snapshot, 2) }}</td>
            <td class="right">{{ number_format($item->subtotal_sbd, 2) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<div class="totals">
    <div class="totals-row">
        <span>Fish subtotal</span>
        <span>{{ number_format($order->items->sum(fn($i) => (float)$i->subtotal_sbd), 2) }} SBD</span>
    </div>
    @if($order->filleting)
    <div class="totals-row">
        <span>Filleting</span>
        <span>+{{ number_format($order->filleting_fee_snapshot, 2) }} SBD</span>
    </div>
    @endif
    @if($order->delivery)
    <div class="totals-row">
        <span>Delivery</span>
        <span>+{{ number_format($order->delivery_fee_snapshot, 2) }} SBD</span>
    </div>
    @endif
    @if((float)$order->discount_sbd > 0)
    <div class="totals-row discount">
        <span>Discount</span>
        <span>−{{ number_format($order->discount_sbd, 2) }} SBD</span>
    </div>
    @endif
    @if((float)$order->tax_sbd > 0)
    <div class="totals-row">
        <span>{{ $order->tax_label_snapshot ?? 'Tax' }}</span>
        <span>+{{ number_format($order->tax_sbd, 2) }} SBD</span>
    </div>
    @endif
    <div class="totals-row divider-row">
        <span>Total</span>
        <span>{{ number_format($order->total_sbd, 2) }} SBD</span>
    </div>
</div>

@if($order->note)
<div class="note-section">
    <h3>Special instructions</h3>
    <p>{{ $order->note }}</p>
</div>
@endif

<div class="footer">
    Thank you for your business — {{ $business->name }}
</div>

</body>
</html>
