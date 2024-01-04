import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { transformCSVToObject } from "./tranformCsvToObj";
import { queue, sendDataToQueue } from "./sendDataToQueue";
import * as os from "os";
import { sleep } from "bun";
import { Job, QueueEvents } from "bullmq";
import { uy3Service } from "./uy3Service";

const app = new Elysia();

// MIDDLEWARES
function csvToObject({}) {}
// MIDDLEWARES

app.get("/", ({}) => "Hello ConnectLis!");

app
  .onBeforeHandle(async ({ body }) => {
    console.log("Entrou no handle");
    // @ts-ignore
    const csv = await body?.csv.text();
    // @ts-ignore
    body.csv = await transformCSVToObject(csv);
  })
  .post(
    "/fgtsBalance",
    async ({ body }) => {
      try {
        console.log(body.csv);
        await sendDataToQueue(body.csv);
        const jobsIds = await sendDataToQueue(body.csv);
        console.log(jobsIds);
        const saldos: any[] = [];
        // const numCPUs = os.cpus().length;
        // console.log(`Seu sistema possui ${numCPUs} núcleos de CPU.`);
        // const caminhoArquivoThread = new URL(
        //   "/home/alcifmais/Projetos/connectlis-backend/uy3Service.ts",
        //   import.meta.url
        // ).href;
        // console.log("Caminho da Thread", caminhoArquivoThread);
        // for (let i = 0; i < numCPUs; i++) {
        //   const worker = new Worker(caminhoArquivoThread);
        //   worker.onmessage = async (event) => {
        //     console.log("Mensagem recebida da thread:", event.data);
        //   };
        //   // worker.postMessage(`Oi da thread ${i + 1} para você, meu amor!`);
        //   worker.onerror = (erro) => {
        //     console.error("Erro na thread:", erro.message);
        //   };
        // }
        await uy3Service();
        for (let jobId of jobsIds) {
          console.log(jobId);
          const jobExist = async () => {
            // await sleep(50);
            const job = await Job.fromId(queue, jobId);
            // console.log(job);
            const isCompleted = await job?.isCompleted();
            console.log(isCompleted);
            if (!isCompleted) {
              await jobExist();
            } else {
              console.log(job);
              saldos.push(await job?.returnvalue);
            }
          };
          await jobExist();
        }

        const resp = JSON.stringify(saldos.filter((s) => s));
        console.log(resp);
        return resp;
      } catch (error) {}
    },
    {
      type: "multipart/form-data",
      body: t.Object({ csv: t.Any() }),
    }
  ).on;

app.use(cors()).listen(3001);

console.log(
  `🦊 Connectlis is running at ${app.server?.hostname}:${app.server?.port}`
);
