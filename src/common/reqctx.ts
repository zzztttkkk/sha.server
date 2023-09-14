import type { EndpointOptions, PathOptions } from "./h2tp.js";
import { vld } from "@ztkisalreadytaken/tspkgs";
import type * as koa from "koa";

const ___VEINS = new vld.ValidationError();
type ValidationError = typeof ___VEINS;

export class VldError {
	constructor(errors: ValidationError[]) {}
}

export interface ParamsOptions {}

export class Context {
	constructor(
		private _kctx: koa.Context,
		private _next: koa.Next,
		private _endpointOpts: EndpointOptions,
		private _pathOpts: PathOptions
	) {}

	get req(): koa.Request {
		return this._kctx.request;
	}

	get resp(): koa.Response {
		return this._kctx.response;
	}

	async next() {
		await this._next();
	}

	async params<T>(cls: { new (): T }): Promise<T> {
		const obj = new cls();
		const errors = await vld.validate(obj as any);
		if (errors && errors.length > 0) {
			throw new VldError(errors);
		}
		return obj as T;
	}
}

export type HandleFunc = (ctx: Context) => Promise<void> | void;
