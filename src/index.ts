import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { transformCSVToObject } from "./tranformCsvToObj";
const app = new Elysia();

// MIDDLEWARES
function csvToObject({}) {}
// MIDDLEWARES

app.get("/", ({}) => "Hello ConnectLis!");
app.post(
  "/fgtsBalance",
  async ({ body }) => {
    const csv = await body.csv.text();

    const dataObj = await transformCSVToObject(csv);

    console.log(dataObj);
  },
  {
    type: "multipart/form-data",
    body: t.Object({ csv: t.Any() }),
  }
);

app.use(cors()).listen(3001);

console.log(
  `🦊 Connectlis is running at ${app.server?.hostname}:${app.server?.port}`
);
