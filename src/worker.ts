import { verify, Field, PrivateKey, PublicKey } from "o1js";
import { zkCloudWorker, Cloud } from "zkcloudworker";
import { ExampleZkApp } from "./contract";
import { CypherText } from "./nats-lib/encryption";
import { postDoneMessage, postReadyMessage, postOptionsMessage } from "./nats-lib/messages"

let VerificationKey: any | null = null;


async function isCompiled(vk: any | null): Promise<any | null> {
  if (!vk) {
    // TODO: use cache !
    try {
      let t0 = Date.now()
      const compiled = await ExampleZkApp.compile();
      vk = compiled.verificationKey;
      let dt = (Date.now() - t0)/1000;
      console.log(`Compiled time=${dt}secs`);
      return vk;
    }
    catch (err) {
      throw Error("Unable to compile SocialcapDeposits contract");
    }
  }
  return vk;
}


export class EncryptedWorker extends zkCloudWorker {

  private secretKey: PrivateKey; // this worker private key
  private publicKey: PublicKey; // this worker public key 
  private payload: any; 

  constructor(cloud: Cloud) {
    super(cloud);
    this.secretKey = PrivateKey.random();
    this.publicKey = this.secretKey.toPublicKey();
  }

  public getAddress() {
    return this.publicKey.toBase58();
  }

  public encrypt(payload: string, publicKey: string) {
    return CypherText.encrypt(payload,  publicKey);
  }

  public decrypt(encrypted: string) {
    return CypherText.decrypt(encrypted, this.secretKey.toBase58());
  }

  /**
   * Executes the worker with the received encryped payload.
   * @param encryptedPayload - where payload = { value: ... }
   * @returns 
   */
  public async execute(transactions: string[]): Promise<string | undefined> {
    console.log(`Task: ${this.cloud.task}`);
    console.log(`Args: ${this.cloud.args}`);
    console.log(`Version: 0.1.6`);

    if (!this.cloud.args) throw new Error("args is undefined");
    const { clientAddress } = JSON.parse(this.cloud.args);
    console.log("Caller is: ", clientAddress);

    // send 'ready' message to the Web Client, with the worker's publicKey
    // so we can encrypt the payload on the client side using this key
    const optionsResponse = await postOptionsMessage(
      clientAddress, 
      this.getAddress()
    );
    let options = this.decrypt(optionsResponse.data.encrypted);
    console.log("Options: ", options);

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

    // compile if not already done
    VerificationKey = await isCompiled(VerificationKey);
    
    // execute worker code ...
    const value = parseInt(decrypted.value);
    this.cloud.log(`Generating the proof for value ${value}`);
    const proof = await ExampleZkApp.check(Field(value));
    const verified = await verify(proof, VerificationKey);
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

    return JSON.stringify(result);
  }
}
