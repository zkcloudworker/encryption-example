import { zkCloudWorker, Cloud } from "zkcloudworker";
export declare class EncryptedWorker extends zkCloudWorker {
    private secretKey;
    private publicKey;
    private payload;
    constructor(cloud: Cloud);
    getAddress(): string;
    encrypt(payload: string, publicKey: string): string;
    decrypt(encrypted: string, privateKey: string): string;
    /**
     * Executes the worker with the received encryped payload.
     * @param encryptedPayload - where payload = { value: ... }
     * @returns
     */
    execute(transactions: string[]): Promise<string | undefined>;
}
