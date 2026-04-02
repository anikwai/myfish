import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { StageNode } from './timeline-types';

export function formatTimestamp(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export function TimelineConnector() {
    return <div className="ml-[11px] h-5 w-px bg-border" />;
}

export function TimelineRow({ node, showActor }: { node: StageNode; showActor: boolean }) {
    if (node.kind === 'on_hold') {
        return <OnHoldNode node={node} showActor={showActor} />;
    }

    if (node.kind === 'rejected') {
        return <RejectedNode node={node} showActor={showActor} />;
    }

    return <StepNode node={node} showActor={showActor} />;
}

function StepNode({ node, showActor }: { node: StageNode; showActor: boolean }) {
    const isFuture = node.state === 'future';

    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
                {node.state === 'completed' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                {node.state === 'current' && <Clock className="h-5 w-5 animate-pulse text-primary" />}
                {isFuture && <Circle className="h-5 w-5 text-muted-foreground/40" />}
            </div>
            <div className="min-w-0 flex-1 pb-1">
                <p className={`text-sm font-medium ${isFuture ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                    {node.label}
                </p>
                {node.log && <Metadata log={node.log} showActor={showActor} />}
            </div>
        </div>
    );
}

function OnHoldNode({ node, showActor }: { node: StageNode; showActor: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
                <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">On hold</p>
                {node.log && <Metadata log={node.log} showActor={showActor} />}
            </div>
        </div>
    );
}

function RejectedNode({ node, showActor }: { node: StageNode; showActor: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
                <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
                <p className="text-sm font-medium text-destructive">Rejected</p>
                {node.log && <Metadata log={node.log} showActor={showActor} />}
                {node.rejectionReason && (
                    <Alert variant="destructive" className="mt-2 py-2">
                        <AlertDescription className="text-xs italic">
                            &ldquo;{node.rejectionReason}&rdquo;
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}

function Metadata({ log, showActor }: { log: NonNullable<StageNode['log']>; showActor: boolean }) {
    return (
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{formatTimestamp(log.timestamp)}</span>
            {showActor && log.actor && (
                <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">
                    {log.actor}
                </Badge>
            )}
        </p>
    );
}
