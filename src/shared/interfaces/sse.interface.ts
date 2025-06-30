import { Subject } from "rxjs";

export interface SSEEvent {
    type: string;
    data: any;
    userId?: string;
    timestamp: Date;
}

export interface SSEConnection {
    userId: string;
    subject: Subject<SSEEvent>;
    lastActivity: Date;
}