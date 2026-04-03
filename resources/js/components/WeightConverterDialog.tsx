import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { kgToLbs, lbsToKg } from '@/lib/pricing';

function round3(n: number): string {
    return (Math.round(n * 1000) / 1000).toFixed(3);
}

export function WeightConverterDialog({ kgToLbsRate }: { kgToLbsRate: number }) {
    const [kg, setKg] = useState('');
    const [lbs, setLbs] = useState('');

    function handleKgChange(value: string) {
        setKg(value);
        const parsed = parseFloat(value);
        setLbs(!isNaN(parsed) ? round3(kgToLbs(parsed, kgToLbsRate)) : '');
    }

    function handleLbsChange(value: string) {
        setLbs(value);
        const parsed = parseFloat(value);
        setKg(!isNaN(parsed) ? round3(lbsToKg(parsed, kgToLbsRate)) : '');
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground">
                    Weight converter
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Weight Converter</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="kg-input">Kilograms (kg)</Label>
                        <Input
                            id="kg-input"
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.000"
                            value={kg}
                            onChange={(e) => handleKgChange(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="lbs-input">Pounds (lbs)</Label>
                        <Input
                            id="lbs-input"
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.000"
                            value={lbs}
                            onChange={(e) => handleLbsChange(e.target.value)}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
