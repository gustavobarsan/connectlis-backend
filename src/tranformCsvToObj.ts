import csvParser from "csv-parser";

export async function transformCSVToObject(csvData: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] | PromiseLike<any[]> = [];
    const parser = csvParser({ separator: ";" });
    parser.on("data", (data) => results.push(data));
    parser.on("end", () => resolve(results));
    parser.on("error", (error) => reject(error));
    parser.write(csvData);
    parser.end();
  });
}
