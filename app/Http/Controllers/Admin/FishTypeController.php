<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FishTypeRequest;
use App\Models\FishType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FishTypeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/fish-types', [
            'fishTypes' => Inertia::defer(fn () => FishType::orderBy('name')->get()),
        ]);
    }

    public function store(FishTypeRequest $request): RedirectResponse
    {
        FishType::create($request->validated());

        return to_route('admin.fish-types.index')->with('status', 'fish-type-created');
    }

    public function update(FishTypeRequest $request, FishType $fishType): RedirectResponse
    {
        $fishType->update($request->validated());

        return to_route('admin.fish-types.index')->with('status', 'fish-type-updated');
    }
}
