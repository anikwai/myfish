<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\FishTypeResource;
use App\Models\FishType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class FishTypeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return FishTypeResource::collection(FishType::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'price_per_pound' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $fishType = FishType::create($data);

        return (new FishTypeResource($fishType))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, FishType $fishType): FishTypeResource
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'price_per_pound' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $fishType->update($data);

        return new FishTypeResource($fishType);
    }

    public function destroy(FishType $fishType): Response
    {
        $fishType->delete();

        return response()->noContent();
    }
}
