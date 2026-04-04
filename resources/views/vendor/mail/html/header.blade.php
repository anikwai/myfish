@props(['url'])
@php
    $mailBusiness = \App\Values\BusinessConfig::current();
    $mailEmbedMessage = isset($message) && $message instanceof \Illuminate\Mail\Message ? $message : null;
    $logoSrc = \App\Support\BusinessMailBranding::logoImgSrc($mailEmbedMessage);
@endphp
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if ($logoSrc)
<img src="{{ $logoSrc }}" class="logo" alt="{{ $mailBusiness->name }}" style="max-height: 75px; width: auto; height: auto; max-width: 220px; object-fit: contain;">
@else
<span style="font-size: 19px; font-weight: bold; color: #18181b;">{{ $mailBusiness->name }}</span>
@endif
</a>
</td>
</tr>
