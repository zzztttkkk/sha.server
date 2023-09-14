import { tspkgs } from './common/tspkgs.js';
import { h2tp } from './common/index.js';
import Koa from "koa";
import Router from "@koa/router";

const app = new Koa();
const router = new Router();

await tspkgs.io.importall(["./build/modules/**/Controller.js"]);
h2tp.init(router);

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, ()=> console.log("app listening on 3000"));
