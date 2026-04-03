import type { StatusLog, StageNode } from './timeline-types';

const HAPPY_PATH = ['placed', 'confirmed', 'packed', 'delivered'];

const STEP_LABELS: Record<string, string> = {
    placed: 'Order placed',
    confirmed: 'Confirmed',
    packed: 'Packed',
    delivered: 'Delivered',
};

/**
 * Pure function — converts raw log data into a flat, ordered array of
 * StageNodes ready for rendering. All branching logic (on_hold detour,
 * rejected terminal, future steps) lives here and nowhere else.
 */
export function buildTimeline(
    logs: StatusLog[],
    currentStatus: string,
    rejectionReason?: string | null,
): StageNode[] {
    const byStatus = Object.fromEntries(logs.map((l) => [l.status, l]));
    const isRejected = currentStatus === 'rejected';
    const isOnHold = currentStatus === 'on_hold';

    const happySteps = isRejected
        ? HAPPY_PATH.slice(0, HAPPY_PATH.indexOf('confirmed'))
        : HAPPY_PATH;

    const nodes: StageNode[] = [];

    happySteps.forEach((status, index) => {
        const log = byStatus[status];
        const isCompleted = !!log;
        const isCurrent = currentStatus === status;
        const state = isCompleted
            ? 'completed'
            : isCurrent
              ? 'current'
              : 'future';

        const isLast = index === happySteps.length - 1;
        const showConnector = !isLast || isOnHold || isRejected;

        nodes.push({
            kind: 'step',
            status,
            label: STEP_LABELS[status],
            state,
            log,
            showConnector,
        });

        // Insert on_hold detour immediately after 'placed'
        if (status === 'placed' && isOnHold && byStatus['on_hold']) {
            nodes.push({
                kind: 'on_hold',
                status: 'on_hold',
                label: 'On hold',
                state: 'current',
                log: byStatus['on_hold'],
                showConnector: true,
            });
        }
    });

    // Append remaining happy-path steps (future) when order is on hold
    if (isOnHold) {
        const remaining = HAPPY_PATH.slice(HAPPY_PATH.indexOf('confirmed'));

        remaining.forEach((status, index) => {
            nodes.push({
                kind: 'step',
                status,
                label: STEP_LABELS[status],
                state: 'future',
                log: undefined,
                showConnector: index < remaining.length - 1,
            });
        });
    }

    // Append rejected terminal node
    if (isRejected && byStatus['rejected']) {
        nodes.push({
            kind: 'rejected',
            status: 'rejected',
            label: 'Rejected',
            state: 'current',
            log: byStatus['rejected'],
            showConnector: false,
            rejectionReason,
        });
    }

    return nodes;
}
