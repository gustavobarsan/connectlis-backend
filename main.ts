import * as os from "os";
const numCPUs = os.cpus().length;
console.log(`Seu sistema possui ${numCPUs} núcleos de CPU.`);
const caminhoArquivoThread = new URL("/src/uy3Service.ts", import.meta.url).href;
console.log("Caminho da Thread", caminhoArquivoThread);
for (let i = 0; i < numCPUs; i++) {
  const worker = new Worker(caminhoArquivoThread);
  worker.onmessage = async (event) => {
    console.log("Mensagem recebida da thread:", event.data);
  };
  worker.onerror = (erro) => {
    console.error("Erro na thread:", erro.message);
  };
}
