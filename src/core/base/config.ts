import { Service } from "../decorators";
import { LogLevel } from "../logger";
import { Utils } from "../utils";

export const Configuration = "config";

export interface Configuration {
    appId: string;
    stage: string;

    logLevel: LogLevel;
    resources: Record<string, string>;
    aliases: Record<string, string>;

    httpSecret: string;
    httpTimeout: string;
    httpLifetime: string;
    internalSecret: string;
    internalTimeout: string;
    remoteTimeout: string;

    remoteSecret(appId: string): string;
    remoteStage(appId: string): string;
}

const REMOTE_STAGE_PREFIX = "REMOTE_STAGE_";
const REMOTE_SECRET_PREFIX = "REMOTE_SECRET_";

export abstract class BaseConfiguration implements Configuration {

    private _appId: string;
    protected config: Record<string, any>;

    constructor(config?: Record<string, any>) {
        this.config = config || process.env;
    }

    public init(appId: string) {
        this._appId = appId;
    }

    get appId(): string { return this._appId; }

    get stage(): string { return this.config.STAGE || "local"; }

    get logLevel(): LogLevel {
        switch (this.config.LOG_LEVEL) {
            case "ALL": return LogLevel.ALL;
            case "TRACE": return LogLevel.TRACE;
            case "DEBUG": return LogLevel.DEBUG;
            case "INFO": return LogLevel.INFO;
            case "WARN": return LogLevel.WARN;
            case "ERROR": return LogLevel.ERROR;
            case "FATAL": return LogLevel.FATAL;
            case "OFF": return LogLevel.OFF;
            default: return LogLevel.INFO;
        }
    }

    get aliases(): Record<string, string> {
        let cfg = this.config.RESOURCES;
        if (!cfg) return {};
        let res = Utils.parseMap(cfg, "$");
        return res;
    }

    get resources(): Record<string, string> {
        let aliases = this.aliases;
        let res = {};
        for (let rsrc in aliases) res[aliases[rsrc]] = rsrc;
        return res;
    }

    get httpSecret(): string { return this.config.REST_SECRET || undefined; }

    get httpTimeout(): string { return this.config.REST_TIMEOUT || "10min"; }

    get httpLifetime(): string { return this.config.REST_LIFETIME || "1h"; }

    get internalSecret(): string { return this.config.INTERNAL_SECRET || undefined; }

    get internalTimeout(): string { return this.config.INTERNAL_TIMEOUT || "5s"; }

    get remoteTimeout(): string { return this.config.REMOTE_TIMEOUT || "5s"; }

    public remoteSecret(appId: string): string {
        appId = appId && appId.split("-").join("_").toUpperCase();
        return this.config[REMOTE_SECRET_PREFIX + appId];
    }

    public remoteStage(appId: string): string {
        appId = appId && appId.split("-").join("_").toUpperCase();
        return this.config[REMOTE_STAGE_PREFIX + appId];
    }
}

@Service(Configuration)
export class DefaultConfiguration extends BaseConfiguration {
    constructor(config?: any) {
        super(config);
    }
}