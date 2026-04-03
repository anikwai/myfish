import { HugeiconsIcon } from '@hugeicons/react';
import { CancelCircleIcon, CheckmarkCircle02Icon, CircleIcon, Clock01Icon } from '@hugeicons/core-free-icons';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { StageNode } from './timeline-types';

function formatTimestamp(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
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
        <div className={`flex items-center gap-2 py-1 ${isFuture ? 'opacity-40' : ''}`}>
            <div className="shrink-0">
                {node.state === 'completed' && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-primary" />}
                {node.state === 'current' && <HugeiconsIcon icon={Clock01Icon} size={16} className="animate-pulse text-primary" />}
                {isFuture && <HugeiconsIcon icon={CircleIcon} size={16} className="text-muted-foreground" />}
            </div>
            <span className="text-sm font-medium">{node.label}</span>
            {node.log && <LogMeta log={node.log} showActor={showActor} />}
        </div>
    );
}

function OnHoldNode({ node, showActor }: { node: StageNode; showActor: boolean }) {
    return (
        <div className="flex items-center gap-2 py-1">
            <div className="shrink-0">
                <HugeiconsIcon icon={Clock01Icon} size={16} className="text-amber-500" />
            </div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">On hold</span>
            {node.log && <LogMeta log={node.log} showActor={showActor} />}
        </div>
    );
}

function RejectedNode({ node, showActor }: { node: StageNode; showActor: boolean }) {
    return (
        <div className="py-1">
            <div className="flex items-center gap-2">
                <div className="shrink-0">
                    <HugeiconsIcon icon={CancelCircleIcon} size={16} className="text-destructive" />
                </div>
                <span className="text-sm font-medium text-destructive">Rejected</span>
                {node.log && <LogMeta log={node.log} showActor={showActor} />}
            </div>
            {node.rejectionReason && (
                <Alert variant="destructive" className="mt-1.5 ml-6 py-2">
                    <AlertDescription className="text-xs italic">&ldquo;{node.rejectionReason}&rdquo;</AlertDescription>
                </Alert>
            )}
        </div>
    );
}

function LogMeta({ log, showActor }: { log: NonNullable<StageNode['log']>; showActor: boolean }) {
    return (
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{formatTimestamp(log.timestamp)}</span>
            {showActor && log.actor && (
                <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">
                    {log.actor}
                </Badge>
            )}
        </span>
    );
}
