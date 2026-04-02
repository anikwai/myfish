import { buildTimeline } from './timeline-renderer';
import { TimelineRow } from './timeline-nodes';
import type { StatusLog } from './timeline-types';

export type { StatusLog };

type OrderTimelineProps = {
    logs: StatusLog[];
    currentStatus: string;
    rejectionReason?: string | null;
    showActor?: boolean;
};

export function OrderTimeline({ logs, currentStatus, rejectionReason, showActor = false }: OrderTimelineProps) {
    const nodes = buildTimeline(logs, currentStatus, rejectionReason);

    return (
        <div>
            {nodes.map((node, i) => (
                <TimelineRow key={`${node.status}-${i}`} node={node} showActor={showActor} />
            ))}
        </div>
    );
}
