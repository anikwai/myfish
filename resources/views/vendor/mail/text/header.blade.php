@php
    $mailBusiness = \App\Values\BusinessConfig::current();
@endphp
{{ $mailBusiness->name }}: {{ $url }}
