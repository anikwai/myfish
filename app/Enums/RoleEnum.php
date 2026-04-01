<?php

namespace App\Enums;

enum RoleEnum: string
{
    case Admin = 'admin';
    case Staff = 'staff';
    case Client = 'client';
}
