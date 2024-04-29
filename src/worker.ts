import { zkCloudWorker, Cloud } from "zkcloudworker";
import { verify, Field, PrivateKey, PublicKey } from "o1js";
import { ExampleZkApp } from "./contract";
import { CypherText } from "./encryption";
import { postDoneMessage, postReadyMessage } from "./caller"
import { connect, JSONCodec } from "nats";

export class EncryptedWorker extends zkCloudWorker {

  private clientAddress: string; // the client public key address
  private secretKey: PrivateKey; // this worker private key
  private publicKey: PublicKey; // this worker public key 
  private payload: any; 

  constructor(cloud: Cloud, clientAddress?: string) {
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
  public async execute(): Promise<string | undefined> {
    if (this.cloud.args === undefined) throw new Error("args is undefined");
    const clientAddress = this.cloud.args;
    console.log("Caller is: ", clientAddress);

    // send 'ready' message to the Web Client, with the worker's publicKey
    // so we can encrypt the payload on the client side using this key
    const response = await postReadyMessage(
      clientAddress, 
      this.getAddress()
    );
    let { command, encrypted } = response.data;
   
   // decrypt payload or raise error
    let decrypted = JSON.parse(CypherText.decrypt(
      encrypted, 
      this.secretKey.toBase58()
    ));

    // execute worker code ...
    const value = parseInt(decrypted.value);
    this.cloud.log(`Generating the proof for value ${value}`);
    const vk = (await ExampleZkApp.compile()).verificationKey;
    const proof = await ExampleZkApp.check(Field(value));
    const verified = await verify(proof, vk);
    this.cloud.log(`Verification result: ${verified}`);

    // we must encrypt the result with the client public key
    // or raise error if encryption fails
    let result = CypherText.encrypt(
      JSON.stringify(proof.toJSON(), null, 2),  
      clientAddress
    );

    // report the final result to client, this may be redundant
    // as the result will be returned by the worker itself
    // but is an experimantal option 
    await postDoneMessage(clientAddress, result);

    return result;
  }
}
