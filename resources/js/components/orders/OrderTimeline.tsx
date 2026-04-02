import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';

export type StatusLog = {
    status: string;
    timestamp: string;
    actor?: string;
};

type OrderTimelineProps = {
    logs: StatusLog[];
    currentStatus: string;
    rejectionReason?: string | null;
    showActor?: boolean;
};

const HAPPY_PATH: string[] = ['placed', 'confirmed', 'packed', 'delivered'];

const STEP_LABELS: Record<string, string> = {
    placed: 'Order placed',
    confirmed: 'Confirmed',
    packed: 'Packed',
    delivered: 'Delivered',
};

function formatTimestamp(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export function OrderTimeline({ logs, currentStatus, rejectionReason, showActor = false }: OrderTimelineProps) {
    const logsByStatus = Object.fromEntries(logs.map((l) => [l.status, l]));
    const isRejected = currentStatus === 'rejected';
    const isOnHold = currentStatus === 'on_hold';

    const rejectedLog = logsByStatus['rejected'];
    const onHoldLog = logsByStatus['on_hold'];

    const stepsToShow = isRejected
        ? HAPPY_PATH.slice(0, HAPPY_PATH.indexOf('confirmed'))
        : HAPPY_PATH;

    return (
        <div className="space-y-1">
            {stepsToShow.map((step, index) => {
                const log = logsByStatus[step];
                const isCompleted = !!log;
                const isCurrent = currentStatus === step;
                const isFuture = !isCompleted && !isCurrent;

                const isLast = index === stepsToShow.length - 1;
                const showConnector = !isLast || isOnHold || isRejected;

                return (
                    <div key={step}>
                        <TimelineRow
                            label={STEP_LABELS[step]}
                            log={log}
                            isCompleted={isCompleted}
                            isCurrent={isCurrent}
                            isFuture={isFuture}
                            showActor={showActor}
                        />
                        {showConnector && <Connector />}

                        {/* On-hold side branch — shown between placed and confirmed */}
                        {step === 'placed' && isOnHold && onHoldLog && (
                            <>
                                <OnHoldRow log={onHoldLog} showActor={showActor} />
                                <Connector />
                            </>
                        )}
                    </div>
                );
            })}

            {/* Rejected terminal node */}
            {isRejected && rejectedLog && (
                <RejectedRow log={rejectedLog} rejectionReason={rejectionReason} showActor={showActor} />
            )}

            {/* Remaining happy-path steps after on_hold */}
            {isOnHold &&
                HAPPY_PATH.slice(HAPPY_PATH.indexOf('confirmed')).map((step, index, arr) => {
                    const isLast = index === arr.length - 1;

                    return (
                        <div key={step}>
                            <TimelineRow
                                label={STEP_LABELS[step]}
                                log={undefined}
                                isCompleted={false}
                                isCurrent={false}
                                isFuture={true}
                                showActor={showActor}
                            />
                            {!isLast && <Connector muted />}
                        </div>
                    );
                })}
        </div>
    );
}

function Connector({ muted = false }: { muted?: boolean }) {
    return <div className={`ml-[11px] h-5 w-px ${muted ? 'bg-border' : 'bg-border'}`} />;
}

function TimelineRow({
    label,
    log,
    isCompleted,
    isCurrent,
    isFuture,
    showActor,
}: {
    label: string;
    log?: StatusLog;
    isCompleted: boolean;
    isCurrent: boolean;
    isFuture: boolean;
    showActor: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
                {isCompleted && <CheckCircle2 className="h-5 w-5 text-primary" />}
                {isCurrent && <Clock className="h-5 w-5 text-primary animate-pulse" />}
                {isFuture && <Circle className="h-5 w-5 text-muted-foreground/40" />}
            </div>
            <div className="min-w-0 flex-1 pb-1">
                <p className={`text-sm font-medium ${isFuture ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                    {label}
                </p>
                {log && (
                    <p className="text-xs text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                        {showActor && log.actor && <> &middot; {log.actor}</>}
                    </p>
                )}
            </div>
        </div>
    );
}

function OnHoldRow({ log, showActor }: { log: StatusLog; showActor: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
                <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">On hold</p>
                <p className="text-xs text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                    {showActor && log.actor && <> &middot; {log.actor}</>}
                </p>
            </div>
        </div>
    );
}

function RejectedRow({
    log,
    rejectionReason,
    showActor,
}: {
    log: StatusLog;
    rejectionReason?: string | null;
    showActor: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
                <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
                <p className="text-sm font-medium text-destructive">Rejected</p>
                <p className="text-xs text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                    {showActor && log.actor && <> &middot; {log.actor}</>}
                </p>
                {rejectionReason && (
                    <p className="mt-1 text-xs text-muted-foreground italic">&ldquo;{rejectionReason}&rdquo;</p>
                )}
            </div>
        </div>
    );
}
