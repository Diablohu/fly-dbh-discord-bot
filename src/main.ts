import Koa from 'koa';

(async (): Promise<void> => {
    console.log(`



╦ ╦╔═╗╦  ╦  ╔═╗  ╦ ╦╔═╗╦═╗╦  ╔╦╗┬
╠═╣║╣ ║  ║  ║ ║  ║║║║ ║╠╦╝║   ║║│
╩ ╩╚═╝╩═╝╩═╝╚═╝  ╚╩╝╚═╝╩╚═╩═╝═╩╝o



`);

    const app = new Koa();

    app.use(async (ctx) => {
        ctx.body = 'Hello World';
    });

    app.listen(3000, function () {
        console.log('LISTENING 3000');
    });
})();
