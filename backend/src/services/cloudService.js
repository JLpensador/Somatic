import CloudConvert from "cloudconvert";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import https from "https";

let cloudConvert = null;

export function initCloudConvert(apiKey) {
  if (!apiKey) {
    console.warn("CloudConvert API key não configurada");
    return false;
  }

  cloudConvert = new CloudConvert(apiKey);
  console.log("CloudConvert inicializado");
  return true;
}

export async function checkCredits() {
  if (!cloudConvert) {
    throw new Error("CloudConvert não inicializado");
  }

  const user = await cloudConvert.users.me();
  return {
    credits: user.credits,
    email: user.email,
  };
}

export async function convertWithCloud(
  inputPath,
  outputPath,
  format,
  originalName
) {
  if (!cloudConvert) {
    throw new Error(
      "CloudConvert não configurado. Adicione CLOUDCONVERT_API_KEY no .env"
    );
  }

  console.log(`CloudConvert: ${originalName} → ${format.toUpperCase()}`);

  let job = await cloudConvert.jobs.create({
    tasks: {
      upload: { operation: "import/upload" },
      convert: {
        operation: "convert",
        input: "upload",
        output_format: format,
        filename: `converted.${format}`,
      },
      export: {
        operation: "export/url",
        input: "convert",
      },
    },
  });

  console.log(`Job criado: ${job.id}`);

  const uploadTask = job.tasks.find((t) => t.name === "upload");
  const fileBuffer = await fs.readFile(inputPath);

  await cloudConvert.tasks.upload(uploadTask, fileBuffer, originalName);
  console.log(`Upload concluído`);

  job = await cloudConvert.jobs.wait(job.id);

  const failedTask = job.tasks.find((t) => t.status === "error");
  if (failedTask) {
    throw new Error(`Conversão falhou: ${failedTask.message}`);
  }

  console.log(`Conversão concluída`);

  const exportTask = job.tasks.find((t) => t.name === "export");
  const fileUrl = exportTask.result.files[0].url;

  await downloadFile(fileUrl, outputPath);
  console.log(`Arquivo salvo: ${outputPath}`);

  return outputPath;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);

    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest).catch(() => {});
        reject(err);
      });
  });
}

export function isCloudConfigured() {
  return cloudConvert !== null;
}
