import express from "express";
import multer from "multer";
import sharp from "sharp";
import cors from "cors";
import fs from "fs";
import { exec } from "child_process";

const app = express();
const port = 3000;

app.use(cors());
const upload = multer({ dest: "uploads/" });

app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const format = req.body.format;

    if (!file || !format) {
      return res.status(400).send("Arquivo ou formato não especificado.");
    }

    const inputPath = file.path;
    const outputPath = `uploads/converted-${Date.now()}.${format}`;
    const mime = file.mimetype;

    // 🖼️ IMAGEM
    if (mime.startsWith("image/")) {
      await sharp(inputPath).toFormat(format).toFile(outputPath);
    }

    // 🎧 ÁUDIO
    else if (mime.startsWith("audio/")) {
      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${inputPath} ${outputPath}`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // 🎬 VÍDEO
    else if (mime.startsWith("video/")) {
      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${inputPath} ${outputPath}`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // 📄 DOCUMENTO
    else if (
      mime === "application/msword" ||
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "text/plain" ||
      mime === "text/markdown"
    ) {
      await new Promise((resolve, reject) => {
        exec(`soffice --headless --convert-to ${format} ${inputPath} --outdir uploads`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Caso tipo desconhecido
    else {
      return res.status(400).send("Tipo de arquivo não suportado.");
    }

    // Envia o resultado final
    res.download(outputPath, (err) => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao converter o arquivo.");
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
