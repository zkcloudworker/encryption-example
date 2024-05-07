"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postDoneMessage = exports.postReadyMessage = void 0;
const nats_1 = require("nats");
const NATS_SERVER = "nats.socialcap.dev:4222";
const codec = (0, nats_1.JSONCodec)();
async function postReadyMessage(clientAddress, workerAddress) {
    // connect to the NATS server and send a 'ready' request
    const nc = await (0, nats_1.connect)({ servers: NATS_SERVER });
    const msg = await nc.request(`zkcw:${clientAddress}`, codec.encode({
        "post": "ready",
        "params": { "key": workerAddress }
    }));
    const response = codec.decode(msg.data);
    console.log("Response: ", response);
    // disconect and clean all pendings
    await nc.drain();
    return response;
}
exports.postReadyMessage = postReadyMessage;
;
async function postDoneMessage(clientAddress, encrypted) {
    // connect to the NATS server and send a 'ready' request
    const nc = await (0, nats_1.connect)({ servers: NATS_SERVER });
    const msg = await nc.request(`zkcw:${clientAddress}`, codec.encode({
        "post": "done",
        "params": { "result": encrypted }
    }));
    const response = codec.decode(msg.data);
    console.log("Response: ", response);
    // disconect and clean all pendings
    await nc.drain();
    return response;
}
exports.postDoneMessage = postDoneMessage;
;
