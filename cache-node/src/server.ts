import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 4000);

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
async function start() {
    // Don’t wait for deps here; app will handle retries/lazy connect.
    const app = await createApp({ connect: false });
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`cache-node listening on ${PORT}`);
    });
}

start().catch((e) => {
    console.error('fatal start error:', e);
    process.exit(1);
});