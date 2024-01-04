import { Redis } from "ioredis";
import { Queue } from "bullmq";

const queueName = "uy3";
const redis = new Redis({ maxRetriesPerRequest: null });
export const queue = new Queue(queueName, { connection: redis });
export async function sendDataToQueue(data: any[]): Promise<any | undefined[]> {
  try {
    const jobsIdList = [];
    for (let d of data) {
      const { id } = await queue.add("add-data", d);
      jobsIdList.push(id);
    }
    return jobsIdList;
  } catch (error) {
    console.log(error);
  }
}
