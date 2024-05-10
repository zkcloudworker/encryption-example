"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptedWorker = void 0;
const o1js_1 = require("o1js");
const zkcloudworker_1 = require("zkcloudworker");
const contract_1 = require("./contract");
const encryption_1 = require("./encryption");
const nats_messages_1 = require("./nats-messages");
let VerificationKey = null;
async function isCompiled(vk) {
    if (!vk) {
        // TODO: use cache !
        try {
            let t0 = Date.now();
            const compiled = await contract_1.ExampleZkApp.compile();
            vk = compiled.verificationKey;
            let dt = (Date.now() - t0) / 1000;
            console.log(`Compiled time=${dt}secs`);
            return vk;
        }
        catch (err) {
            throw Error("Unable to compile SocialcapDeposits contract");
        }
    }
    return vk;
}
class EncryptedWorker extends zkcloudworker_1.zkCloudWorker {
    constructor(cloud) {
        super(cloud);
        this.secretKey = o1js_1.PrivateKey.random();
        this.publicKey = this.secretKey.toPublicKey();
    }
    getAddress() {
        return this.publicKey.toBase58();
    }
    encrypt(payload, publicKey) {
        return encryption_1.CypherText.encrypt(payload, publicKey);
    }
    decrypt(encrypted, privateKey) {
        return encryption_1.CypherText.decrypt(encrypted, privateKey);
    }
    /**
     * Executes the worker with the received encryped payload.
     * @param encryptedPayload - where payload = { value: ... }
     * @returns
     */
    async execute(transactions) {
        console.log(`Task: ${this.cloud.task}`);
        console.log(`Args: ${this.cloud.args}`);
        if (!this.cloud.args)
            throw new Error("args is undefined");
        const { clientAddress } = JSON.parse(this.cloud.args);
        console.log("Caller is: ", clientAddress);
        // send 'ready' message to the Web Client, with the worker's publicKey
        // so we can encrypt the payload on the client side using this key
        const optionsResponse = await (0, nats_messages_1.postOptionsMessage)(clientAddress, this.getAddress());
        let { optionsCommand, encryptedOptions } = optionsResponse.data;
        // send 'ready' message to the Web Client, with the worker's publicKey
        // so we can encrypt the payload on the client side using this key
        const response = await (0, nats_messages_1.postReadyMessage)(clientAddress, this.getAddress());
        let { command, encrypted } = response.data;
        // decrypt payload or raise error
        let decrypted = JSON.parse(encryption_1.CypherText.decrypt(encrypted, this.secretKey.toBase58()));
        // compile if not already done
        VerificationKey = await isCompiled(VerificationKey);
        // execute worker code ...
        const value = parseInt(decrypted.value);
        this.cloud.log(`Generating the proof for value ${value}`);
        const proof = await contract_1.ExampleZkApp.check((0, o1js_1.Field)(value));
        const verified = await (0, o1js_1.verify)(proof, VerificationKey);
        this.cloud.log(`Verification result: ${verified}`);
        // we must encrypt the result with the client public key
        // or raise error if encryption fails
        let result = encryption_1.CypherText.encrypt(JSON.stringify(proof.toJSON(), null, 2), clientAddress);
        // report the final result to client, this may be redundant
        // as the result will be returned by the worker itself
        // but is an experimantal option 
        await (0, nats_messages_1.postDoneMessage)(clientAddress, result);
        return JSON.stringify(result);
    }
}
exports.EncryptedWorker = EncryptedWorker;
