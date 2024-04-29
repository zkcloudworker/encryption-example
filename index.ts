import { Cloud, zkCloudWorker } from "zkcloudworker";
import { initializeBindings } from "o1js";
import { EncryptedWorker } from "./src/worker";

// Keep this for compatibility
export async function zkcloudworker(
  cloud: Cloud,
  clientAddress?: string
): Promise<EncryptedWorker> {
  await initializeBindings();
  return new EncryptedWorker(cloud, clientAddress);
}
