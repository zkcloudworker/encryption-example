import "dotenv/config";
import { NATSClient, listen } from "./nats-client";
import { zkCloudWorkerClient } from "zkcloudworker";
import { CypherText } from "./encryption";


async function main(args: string[]) {
  console.log(`zkCloudWorker Encryption Example (c) MAZ 2024 www.zkcloudworker.com`);

  // start a NATS client to simulate the web API calling the worker
  // the caller web API instance will have a unique publicKey 
  let natsClient = await NATSClient({
    // send 'options' to worker
    // this is first message the worker will send BEFORE doing
    // any work and can be used to pass encrypted options to it
    // @returns - object with pre execution options
    onOptions: (params: any) => {
      return {
        "envEncryptionKey": "1234"
      }
    },

    // send payload to worker
    // this is the second message the worker will send asking for the 
    // transactions payload that needs for execution
    // @returns - object with payload
    onReady: (params: any) => {
      return {
         "value": Math.ceil(Math.random() * 100).toString() 
      }
    },

    // send 'done' final status to worker
    // this is the message worker will send with the final result
    // when it has finished.
    // @returns - object with final web client status
    onDone: (params: any) => {
      return {
        "success": true
      }
    }
  });

  // create the API client
  const api = new zkCloudWorkerClient({
    jwt: process.env.JWT as string
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

  console.log("\nAPI response:", response);
  const jobId = response?.jobId;
  if (jobId === undefined) {
    throw new Error("Job ID is undefined");
  }

  console.log("\nWaiting for job ...");
  const jobResult = await api.waitForJobResult({ jobId });
  console.log("Job encrypted result:", JSON.stringify(jobResult, null, 2));

  // extract final worker's 'result'
  let { result } = jobResult.result;
  let decrypted = CypherText.decrypt(JSON.parse(result), natsClient.secret);
  console.log("\nDecrypted result:", decrypted);
}

main(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
