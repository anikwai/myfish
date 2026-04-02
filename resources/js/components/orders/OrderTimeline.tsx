import { buildTimeline } from './timeline-renderer';
import { TimelineConnector, TimelineRow } from './timeline-nodes';
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
        <div className="space-y-1">
            {nodes.map((node, i) => (
                <div key={`${node.status}-${i}`}>
                    <TimelineRow node={node} showActor={showActor} />
                    {node.showConnector && <TimelineConnector />}
                </div>
            ))}
        </div>
    );
}
