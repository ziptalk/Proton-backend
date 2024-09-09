import app from './app';
import fs from "fs";
import https from "https";
import { scheduleJob } from 'node-schedule';
import { saveBotBalance } from './services/stargateClient';



const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 4000;

app.listen(HTTP_PORT, () => {
    console.log(`Server running on port ${HTTP_PORT}`);

    scheduleJob('0 0 * * *', async function () {
        saveBotBalance();
    });
});

const domainName = process.env.DOMAIN_NAME;
try {
    const keyFile = fs.readFileSync(`/etc/letsencrypt/live/${domainName}/privkey.pem`);
    const certFile = fs.readFileSync(`/etc/letsencrypt/live/${domainName}/fullchain.pem`);
    const options = {
        key: keyFile,
        cert: certFile,
    };

    https.createServer(options, app).listen(HTTPS_PORT, () => {
        console.log(`Server running at https://localhost:${HTTPS_PORT}`);
    });
} catch (error) {
    console.error(`There was a problem while running the server on HTTPS - message: ${error}`);
}