import { Cloud, zkCloudWorker } from "zkcloudworker";
import { EncryptedWorker } from "./src/worker";

// Keep this for compatibility
export async function zkcloudworker(
  cloud: Cloud,
  clientAddress: string
): Promise<EncryptedWorker> {
  return new EncryptedWorker(cloud, clientAddress);
}
