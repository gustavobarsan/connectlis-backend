import { Job, Worker } from "bullmq";
import axios from "axios";
import { Redis } from "ioredis";
import { sleep } from "bun";

export async function uy3Service() {
  console.log("RODOU O UY3 SERVICE");
  const redis = new Redis({ maxRetriesPerRequest: null });
  const queueName = "uy3";
  try {
    const uy3Worker = new Worker(queueName, getBalanceUy3, {
      connection: redis,
    });
    if (!uy3Worker.isRunning()) {
      uy3Worker.run();
    }
  } catch (error) {
    console.log(error);
  }
}

async function getBalanceUy3(job: Job) {
  console.log("JOB ID: ", job.id);
  const token = await authUy3();
  try {
    const { data } = job;
    const listIds = await getId(token, data.nome, data.CPF);
    if (listIds.length > 0) {
      let finalBalance;
      for (let i of listIds) {
        finalBalance = await getBalance(token, i.id, data.nome, data.CPF);
      }
      return finalBalance;
    }
    return {
      nome: data.nome,
      cpf: data.CPF,
      saldo: "Saldo não encontrado",
    };
  } catch (error) {}
}

async function authUy3(): Promise<string> {
  let options = {
    method: "POST",
    url: "https://alcifmais-uy3-prd.auth.sa-east-1.amazoncognito.com/oauth2/token",
    headers: {
      cookie: "XSRF-TOKEN=b4333709-3c12-4bd7-96b7-245401982dd1",
      Authorization:
        "Basic bTZ1Y2tvZGpldGNpcGxjZGdydmkydnZsbjp2MTk4Y2VnYnZtMmxsYmcydGk4NGNhMmNpZmc1aWIzZXU2aThsZ3VucXVrajdhMzlqN3A=",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: { grant_type: "client_credentials", scope: "credit/11510" },
  };

  return axios
    .request(options)
    .then(function (response) {
      return response.data.access_token;
    })
    .catch(function (error) {
      console.error(error);
    });
}

async function getId(token: string, name: string, cpf: string): Promise<any> {
  let options = {
    method: "GET",
    url: "https://api.uy3.com.br/v1/Person",
    params: {
      searchString: name,
    },
    headers: {
      "User-Agent": "insomnia/2023.5.8",
      Authorization: `Bearer ${token}`,
    },
  };

  const { data } = await axios.request(options);

  const listaComCpfCorreto = [];
  for (let i of data.data) {
    if (String(i.registrationNumber) === String(cpf)) {
      listaComCpfCorreto.push(i);
    }
  }
  return listaComCpfCorreto;
}

async function getBalance(
  token: string,
  id: string,
  nome: string,
  cpf: string
) {
  // await sleep(500);
  let options = {
    method: "POST",
    url: `https://api.uy3.com.br/v1/NaturalPerson/${id}/Dataset/fgts`,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "insomnia/2023.5.8",
      Authorization: `Bearer ${token}`,
    },
    data: {},
  };
  const { data } = await axios.request(options);

  const saldo = data[0].result.periodos.reduce(
    (acc: any, periodo: { valor: any }) => {
      return acc + periodo.valor;
    },
    0
  );

  if (saldo) {
    const retorno = {
      nome,
      cpf,
      saldo: `R$${saldo.toFixed(2)}`,
    };
    return retorno;
  }
  const retorno = {
    nome,
    cpf,
    saldo: "Saldo não encontrado",
  };
  return retorno;
}

await uy3Service();
