const Koa = require('koa');
const Router = require('@koa/router');
const serve = require("koa-static");
const bodyParser = require('koa-bodyparser');
// const stream = require('stream');
const send = require("koa-send");
const G = require('./global');
const app = new Koa();

app.use(serve(__dirname + "/public"));
app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      err.status = err.statusCode || err.status || 500;
      ctx.body = err.stack;
    }
  });
const router = new Router();

app.use(bodyParser());
app.use(router.routes())
  .use(router.allowedMethods());


console.log('Server running at http://localhost:' + G.HTTP_PORT);
app.listen(G.HTTP_PORT);

// check system and open browser window
if (!G.isElectron) {
    const os = require('os');
    const { exec } = require('child_process');
    if (os.platform() === 'win32') {
        exec(`start http://localhost:${G.HTTP_PORT}/`);
    }else {
        exec(`open http://localhost:${G.HTTP_PORT}/`);
    }
}

