"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zkcloudworker = void 0;
const o1js_1 = require("o1js");
const worker_1 = require("./src/worker");
// Keep this for compatibility
async function zkcloudworker(cloud) {
    await (0, o1js_1.initializeBindings)();
    return new worker_1.EncryptedWorker(cloud);
}
exports.zkcloudworker = zkcloudworker;
