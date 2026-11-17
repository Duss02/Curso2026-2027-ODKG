import { Model } from '../common';
/**
 * Domain model representing the current build progress of a connector instance.
 */
export declare class ConnectorBuildStatus extends Model<ConnectorBuildStatus> {
    status: string;
    processedEntities: number;
    estimatedEntities: number;
    indexedEntities: number;
    entitiesPerSecond: number;
    etaSeconds: number;
    repair: boolean;
    constructor(status?: string, processedEntities?: number, estimatedEntities?: number, indexedEntities?: number, entitiesPerSecond?: number, etaSeconds?: number, repair?: boolean);
    get isBuilt(): boolean;
    get percentDone(): number;
}
