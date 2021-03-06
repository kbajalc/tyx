import {
    RemoteRequest
} from "../core/types";

import {
    ProxyMetadata
} from "../core/metadata";

import {
    BaseProxy
} from "../core/base";

import {
    InternalServerError
} from "../core/errors";

import {
    LambdaError
} from "./error";

import { Lambda } from "aws-sdk";

export abstract class LambdaProxy extends BaseProxy {
    private lambda: Lambda;

    constructor() {
        super();
        this.lambda = new Lambda();
    }

    protected async token(call: RemoteRequest): Promise<string> {
        return await this.security.issueToken({
            audience: call.application,
            subject: call.type,
            userId: null,
            role: "Application"
        });
    }

    protected async invoke(call: RemoteRequest): Promise<any> {
        let stage = call.type === "remote"
            ? this.config.remoteStage(call.application)
            : this.config.stage;

        let fun = ProxyMetadata.functionName(this);


        let response: Lambda.InvocationResponse;
        try {
            response = await this.lambda.invoke({
                FunctionName: stage + "-" + fun,
                Payload: JSON.stringify(call)
            }).promise();
        } catch (err) {
            throw InternalServerError.wrap(err);
        }

        let result = JSON.parse(response.Payload.toString());

        if (response.FunctionError === "Handled") {
            throw LambdaError.parse(result.errorMessage);
        } else if (response.FunctionError === "Unhandled") {
            throw InternalServerError.wrap(result.errorMessage);
        } else {
            return result;
        }
    }
}
