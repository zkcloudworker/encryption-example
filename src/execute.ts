import "dotenv/config";
import { PrivateKey } from "o1js";
import { listen } from "./nats-client";
import { zkCloudWorkerClient } from "zkcloudworker";
import { CypherText } from "./encryption";

interface NATSClient {
  address: string;
  secret: string;
}

async function startNATSClient(): Promise<NATSClient> {
  // create some client address, this will be done by 
  // the web API BEFORE calling a worker
  const secret = PrivateKey.random();
  let address = secret.toPublicKey().toBase58();
  console.log("Cliente address ", address);

   // now subscribe and listen in this Address
   // we use the 'zkcw' prefix for zkCloudWorkers subscriptions
  await listen(`zkcw:${address}`);

  return { 
    address: address, 
    secret: secret.toBase58()
  };
}


async function main(args: string[]) {
  console.log(`zkCloudWorker Encryption Example (c) MAZ 2024 www.zkcloudworker.com`);

  // start a NATS client to simulate the web API calling the worker
  // the caller web API instance will have a unique publicKey 
  let natsClient = await startNATSClient();

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

  console.log("API response:", response);
  const jobId = response?.jobId;
  if (jobId === undefined) {
    throw new Error("Job ID is undefined");
  }

  console.log("Waiting for job ...");
  const jobResult = await api.waitForJobResult({ jobId });
  console.log("Job encrypted result:", JSON.stringify(jobResult, null, 2));

  // extract final worker's 'result'
  let { result } = jobResult.result;
  let decrypted = CypherText.decrypt(result, natsClient.secret);
  console.log("Decrypted result:", decrypted);
}

main(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
