import "reflect-metadata";
import { Controller } from "./Controller.js";
import { Context, VldError } from "./reqctx.js";
import * as koa from "koa";
import Router from "@koa/router";

export { Context, Controller, VldError };

interface Path {
	key: string;
	opts: PathOptions;
}

interface EndpointInfo {
	paths: Path[];
	options: EndpointOptions;
}

const endpoints = new Map<Function, EndpointInfo>();

export interface EndpointOptions {
	prefix?: string;
	conconstructArgs?: any[];
	noExtendsHandler?: boolean;
}

export function endpoint(opts?: EndpointOptions): ClassDecorator {
	return (cls: Function) => {
		opts = opts || {};
		if (!opts.noExtendsHandler && !(cls.prototype instanceof Controller)) {
			throw new Error(
				`[class ${cls.name}] is not a subclass of [class Controller]`
			);
		}
		const endpoint = endpoints.get(cls);
		if (!endpoint) {
			console.warn(`empty handler [class ${cls.name}]`);
			return;
		}
		endpoint.options = opts;
	};
}

export type Method = "get" | "post" | "put" | "delete" | "patch";

export interface PathOptions {
	methods?: Method | Method[];
	path?: string;
}

export function path(opts?: PathOptions): MethodDecorator {
	return function (
		target: Object,
		key: string | symbol,
		descriptor: TypedPropertyDescriptor<any>
	) {
		if (typeof key === "symbol") return;
		if (descriptor && (descriptor.get || descriptor.set)) return;
		const cls = target.constructor;

		const endpoint: EndpointInfo = endpoints.get(cls) || {
			paths: [],
			options: {},
		};

		opts = opts || {};
		const path = opts.path || key;
		opts.path = path;

		endpoint.paths.push({ key, opts });
		endpoints.set(cls, endpoint);
	};
}

function makeHandler(Cls: Function, opts: EndpointOptions, path: Path) {
	return async (kctx: koa.Context, next: koa.Next) => {
		let ins;
		if (opts.conconstructArgs) {
			ins = new (Cls as any)(...opts.conconstructArgs);
		} else {
			ins = new (Cls as any)();
		}

		const ctx = new Context(kctx, next, opts, path.opts);
		await ins[path.key](ctx);
	};
}

function cleanPath(v: string): string {
	while (true) {
		if (!v.includes("//")) {
			break;
		}
		v = v.replaceAll("//", "/");
	}

	while (v.endsWith("/")) {
		v = v.slice(0, v.length - 1);
	}
	return v;
}

export function init(router: Router) {
	for (const [cls, infos] of endpoints) {
		let prefix = cls.name.toLocaleLowerCase();
		if (prefix.endsWith("controller")) {
			prefix = prefix.slice(0, prefix.length - 10);
		}
		if (infos.options.prefix) {
			prefix = infos.options.prefix;
		}
		prefix = `/${prefix}/`;

		for (const path of infos.paths) {
			let url = path.key.toLowerCase();
			if (path.opts.path) {
				url = path.opts.path;
			}
			url = cleanPath(`${prefix}${url}`);

			const handler = makeHandler(cls, infos.options, path);
			let methods: Method[];
			if (Array.isArray(path.opts.methods)) {
				methods = path.opts.methods;
			} else if (path.opts.methods) {
				methods = [path.opts.methods];
			} else {
				methods = ["get"];
			}

			console.log(`Route: [${methods.join(",").toUpperCase()}] ${url}`);

			router.register(url, methods, handler);
		}
	}
}

