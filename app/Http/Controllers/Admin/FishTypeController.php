<?php

namespace App\Http\Controllers\Admin;

use App\Actions\CreateFishType;
use App\Actions\UpdateFishType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FishTypeRequest;
use App\Models\FishType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FishTypeController extends Controller
{
    public function __construct(
        private readonly CreateFishType $createFishType,
        private readonly UpdateFishType $updateFishType,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/fish-types', [
            'fishTypes' => Inertia::defer(fn () => FishType::orderBy('name')->get(['id', 'name', 'is_active', 'price_per_pound'])),
        ]);
    }

    public function store(FishTypeRequest $request): RedirectResponse
    {
        $this->createFishType->handle($request->validated());

        return to_route('admin.fish-types.index')->with('status', 'fish-type-created');
    }

    public function update(FishTypeRequest $request, FishType $fishType): RedirectResponse
    {
        $this->updateFishType->handle($fishType, $request->validated());

        return to_route('admin.fish-types.index')->with('status', 'fish-type-updated');
    }
}
