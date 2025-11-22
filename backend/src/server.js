import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { ensureDir } from "./utils/cleanup.js";
import {
  initCloudConvert,
  checkCredits,
  isCloudConfigured,
} from "./services/cloudService.js";
import { getSupportedImageFormats } from "./services/imageService.js";
import convertRoute from "./routes/convert.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use("/convert", convertRoute);

// Health check
app.get("/health", async (req, res) => {
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      sharp: true,
      cloudConvert: isCloudConfigured(),
    },
  };

  // Verificar créditos se CloudConvert estiver configurado
  if (isCloudConfigured()) {
    try {
      const credits = await checkCredits();
      status.cloudConvert = credits;
    } catch (err) {
      status.cloudConvert = { error: err.message };
    }
  }

  res.json(status);
});

// Formatos suportados
app.get("/formats", (req, res) => {
  res.json({
    image: {
      local: true,
      formats: getSupportedImageFormats(),
    },
    documents: {
      local: false,
      note: "Requer CloudConvert",
      formats: [
        "pdf",
        "docx",
        "doc",
        "odt",
        "txt",
        "rtf",
        "html",
        "xlsx",
        "csv",
      ],
    },
    audio: {
      local: false,
      note: "Requer CloudConvert",
      formats: ["mp3", "wav", "ogg", "flac", "aac", "m4a"],
    },
    video: {
      local: false,
      note: "Requer CloudConvert",
      formats: ["mp4", "avi", "mkv", "mov", "webm"],
    },
  });
});

// Inicialização
async function start() {
  // Criar pasta de uploads
  await ensureDir("uploads");

  // Inicializar CloudConvert
  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  initCloudConvert(apiKey);

  // Iniciar servidor
  app.listen(PORT, () => {
    console.log("\n========================================");
    console.log("SOMATIC CONVERTER API");
    console.log("========================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log("----------------------------------------");
    console.log("Serviços:");
    console.log("Sharp (imagens) - Local");

    if (isCloudConfigured()) {
      console.log("CloudConvert - Configurado");
      checkCredits()
        .then((c) => console.log(`Créditos: ${c.credits}`))
        .catch(() => {});
    } else {
      console.log("CloudConvert - Não configurado");
      console.log("");
      console.log("Para habilitar conversão de documentos/mídia:");
      console.log("1. Acesse: https://cloudconvert.com/dashboard/api/v2/keys");
      console.log("2. Crie uma API key gratuita");
      console.log("3. Adicione no .env: CLOUDCONVERT_API_KEY=sua_chave");
    }

    console.log("========================================\n");
  });
}

start().catch(console.error);
