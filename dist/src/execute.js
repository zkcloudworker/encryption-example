"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const o1js_1 = require("o1js");
const nats_client_1 = require("./nats-client");
const zkcloudworker_1 = require("zkcloudworker");
async function startNATSClient() {
    // create some client address, this will be done by 
    // the web API BEFORE calling a worker
    const secret = o1js_1.PrivateKey.random();
    let address = secret.toPublicKey().toBase58();
    console.log("Cliente address ", address);
    // now subscribe and listen in this Address
    // we use the 'zkcw' prefix for zkCloudWorkers subscriptions
    await (0, nats_client_1.listen)(`zkcw:${address}`);
    return {
        address: address,
        secret: secret.toBase58()
    };
}
async function main(args) {
    console.log(`zkCloudWorker Encryption Example (c) MAZ 2024 www.zkcloudworker.com`);
    // start a NATS client to simulate the web API calling the worker
    // the caller web API instance will have a unique publicKey 
    let natsClient = await startNATSClient();
    // create the API client
    const api = new zkcloudworker_1.zkCloudWorkerClient({
        jwt: process.env.JWT
    });
    // start the worker
    const response = await api.execute({
        mode: "async",
        repo: "encryption-example",
        developer: "MAZ",
        task: "create-proof",
        metadata: `Run encrypted comms`,
        args: JSON.stringify({
            //give it the client adresss that will be used 
            // for handshaking between client and worker
            clientAddress: natsClient.address,
        }),
        transactions: [] // payload will be sent by the NATS client
    });
    console.log("API response:", response);
    const jobId = response?.jobId;
    if (jobId === undefined) {
        throw new Error("Job ID is undefined");
    }
    console.log("Waiting for job ...");
    const result = await api.waitForJobResult({ jobId });
    console.log("Job encrypted result:", result);
}
main(process.argv.slice(2))
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
