import { vld } from "@ztkisalreadytaken/tspkgs";
import { h2tp } from "../../common/index.js";

class Params {
	@vld.IsInt()
	q: number;

	add() {
		this.q++;
		console.log(this.q);
	}
}

@h2tp.endpoint()
export class AccountController extends h2tp.Controller {
	@h2tp.path({ methods: "post" })
	async register(ctx: h2tp.Context) {
		const params = await ctx.params(Params);
		params.add();
		console.log(params);
		
	}
}
