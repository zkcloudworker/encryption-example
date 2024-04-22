import { zkCloudWorker, Cloud } from "zkcloudworker";
import { verify, Field, PrivateKey, PublicKey } from "o1js";
import { CypherText } from "./encrypt";

import { ExampleZkApp } from "./contract";

export class EncryptedWorker extends zkCloudWorker {

  private clientAddress: string; // the client public key address
  private secretKey: PrivateKey; // this worker private key
  private publicKey: PublicKey; // this worker public key 
  private payload: any; 

  constructor(cloud: Cloud, clientAddress: string) {
    super(cloud);
    this.clientAddress = clientAddress || "";
    this.secretKey = PrivateKey.random();
    this.publicKey = this.secretKey.toPublicKey();
  }

  public getAddress() {
    return this.publicKey.toBase58();
  }

  public encrypt(payload: string, publicKey: string) {
    return CypherText.encrypt(payload,  publicKey);
  }

  public decrypt(encrypted: string, privateKey: string) {
    return CypherText.decrypt(encrypted, privateKey);
  }

  /**
   * Executes the worker with the received encryped payload.
   * @param encryptedPayload - where payload = { value: ... }
   * @returns 
   */
  public async execute(encryptedPayload: any): Promise<string | undefined> {
    if (!encryptedPayload) throw new Error("No payload received");

    // decrypt payload or raise error
    let payload = JSON.parse(this.decrypt(
      encryptedPayload, 
      this.secretKey.toBase58()
    ));

    // execute worker code ...
    const value = parseInt(payload.value);
    this.cloud.log(`Generating the proof for value ${value}`);
    const vk = (await ExampleZkApp.compile()).verificationKey;
    const proof = await ExampleZkApp.check(Field(value));
    const verified = await verify(proof, vk);
    this.cloud.log(`Verification result: ${verified}`);

    // we must encrypt the result with the client public key
    // or raise error if encryption fails
    return this.encrypt(
      JSON.stringify(proof.toJSON(), null, 2),  
      this.clientAddress
    );
  }
}
