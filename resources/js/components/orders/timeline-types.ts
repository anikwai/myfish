export type StatusLog = {
    status: string;
    timestamp: string;
    actor?: string;
};

export type StageState = 'completed' | 'current' | 'future';
export type StageKind = 'step' | 'on_hold' | 'rejected';

export type StageNode = {
    kind: StageKind;
    status: string;
    label: string;
    state: StageState;
    log: StatusLog | undefined;
    showConnector: boolean;
    rejectionReason?: string | null;
};
