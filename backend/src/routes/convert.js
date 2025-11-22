import { Router } from "express";
import multer from "multer";
import path from "path";
import { cleanupFile, fileExists } from "../utils/cleanup.js";
import {
  convertImage,
  canConvertImage,
  isImageFormat,
} from "../services/imageService.js";
import {
  convertWithCloud,
  isCloudConfigured,
} from "../services/cloudService.js";

const router = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: (process.env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024 },
});

router.post("/", upload.single("file"), async (req, res) => {
  let inputPath = null;
  let outputPath = null;

  try {
    const file = req.file;
    const format = req.body.format?.toLowerCase();

    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    if (!format || !/^[a-z0-9]+$/.test(format)) {
      await cleanupFile(file.path);
      return res.status(400).json({ error: "Formato inválido" });
    }

    inputPath = file.path;
    const mime = file.mimetype;

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    outputPath = path.join(
      "uploads",
      `converted-${timestamp}-${random}.${format}`
    );

    console.log(`\nConvertendo: ${file.originalname}`);
    console.log(`Tipo: ${mime} → ${format.toUpperCase()}`);

    if (canConvertImage(mime) && isImageFormat(format)) {
      await convertImage(inputPath, outputPath, format);
    } else {
      if (!isCloudConfigured()) {
        await cleanupFile(inputPath);
        return res.status(503).json({
          error: "CloudConvert não configurado",
          hint: "Adicione CLOUDCONVERT_API_KEY no arquivo .env",
        });
      }
      await convertWithCloud(inputPath, outputPath, format, file.originalname);
    }

    if (!(await fileExists(outputPath))) {
      throw new Error("Arquivo convertido não foi gerado");
    }

    console.log(`Sucesso`);

    res.download(outputPath, `converted.${format}`, async (err) => {
      await cleanupFile(inputPath);
      await cleanupFile(outputPath);
      if (err && !res.headersSent) {
        console.error("Erro no download:", err.message);
      }
    });
  } catch (error) {
    console.error("Erro:", error.message);
    await cleanupFile(inputPath);
    await cleanupFile(outputPath);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Erro ao converter arquivo",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
});

export default router;
