<?php

namespace App\Enums;

enum DiscountMode: int
{
    case Off = 0;
    case Fixed = 1;
    case Percent = 2;
}
