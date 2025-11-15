import express from "express";
import multer from "multer";
import sharp from "sharp";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const app = express();
const port = 3000;

// Configurações
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const UPLOAD_DIR = "uploads";

// Status das ferramentas instaladas
let toolsAvailable = {
  libreoffice: false,
  ffmpeg: false,
  pdftotext: false
};

// Mapa de conversões possíveis
const CONVERSION_MAP = {
  'image/png': ['jpg', 'jpeg', 'webp', 'gif', 'avif', 'tiff', 'bmp'],
  'image/jpeg': ['png', 'webp', 'gif', 'avif', 'tiff', 'bmp'],
  'image/jpg': ['png', 'webp', 'gif', 'avif', 'tiff', 'bmp'],
  'image/webp': ['png', 'jpg', 'jpeg', 'gif', 'avif', 'tiff'],
  'image/gif': ['png', 'jpg', 'jpeg', 'webp', 'avif'],
  
  'audio/mpeg': ['wav', 'ogg', 'flac', 'aac', 'm4a'],
  'audio/mp3': ['wav', 'ogg', 'flac', 'aac', 'm4a'],
  'audio/wav': ['mp3', 'ogg', 'flac', 'aac', 'm4a'],
  'audio/ogg': ['mp3', 'wav', 'flac', 'aac', 'm4a'],
  'audio/flac': ['mp3', 'wav', 'ogg', 'aac', 'm4a'],
  
  'video/mp4': ['avi', 'mkv', 'mov', 'webm', 'flv'],
  'video/x-msvideo': ['mp4', 'mkv', 'mov', 'webm', 'flv'],
  'video/x-matroska': ['mp4', 'avi', 'mov', 'webm', 'flv'],
  'video/quicktime': ['mp4', 'avi', 'mkv', 'webm', 'flv'],
  
  'application/pdf': ['txt', 'docx', 'odt', 'rtf', 'html'],
  'application/msword': ['pdf', 'docx', 'odt', 'txt', 'rtf', 'html'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['pdf', 'doc', 'odt', 'txt', 'rtf', 'html'],
  'application/vnd.oasis.opendocument.text': ['pdf', 'docx', 'doc', 'txt', 'rtf', 'html'],
  'text/plain': ['pdf', 'docx', 'odt', 'rtf', 'html'],
  'text/markdown': ['pdf', 'docx', 'odt', 'html', 'txt'],
  'text/html': ['pdf', 'docx', 'odt', 'txt'],
};

// Middleware
app.use(cors());
app.use(express.json());

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: MAX_FILE_SIZE }
});

// Função para verificar se comando existe
async function commandExists(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

// Verificar ferramentas disponíveis na inicialização
async function checkTools() {
  console.log('\nVerificando ferramentas instaladas...');
  
  // Verificar LibreOffice (tentar vários comandos)
  const libreOfficeCommands = ['soffice', 'libreoffice', 'flatpak run org.libreoffice.LibreOffice'];
  for (const cmd of libreOfficeCommands) {
    if (await commandExists(cmd.split(' ')[0])) {
      toolsAvailable.libreoffice = cmd;
      console.log(`LibreOffice encontrado: ${cmd}`);
      break;
    }
  }
  if (!toolsAvailable.libreoffice) {
    console.log('LibreOffice NÃO encontrado');
    console.log('Instale: sudo rpm-ostree install libreoffice');
    console.log('Ou: flatpak install flathub org.libreoffice.LibreOffice');
  }
  
  // Verificar FFmpeg
  if (await commandExists('ffmpeg')) {
    toolsAvailable.ffmpeg = true;
    console.log('FFmpeg encontrado');
  } else {
    console.log('FFmpeg NÃO encontrado');
    console.log('Instale: sudo rpm-ostree install ffmpeg');
  }
  
  // Verificar pdftotext
  if (await commandExists('pdftotext')) {
    toolsAvailable.pdftotext = true;
    console.log('pdftotext encontrado');
  } else {
    console.log('pdftotext NÃO encontrado (opcional para PDF→TXT)');
    console.log('Instale: sudo rpm-ostree install poppler-utils');
  }
  
  console.log('');
}

// Funções auxiliares
async function cleanupFile(filePath) {
  if (!filePath) return;
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`Arquivo removido: ${filePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Erro ao limpar arquivo:`, err.message);
    }
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function canConvert(mimeType, targetFormat) {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedFormat = targetFormat.toLowerCase();
  
  if (!CONVERSION_MAP[normalizedMime]) {
    for (const [mime, formats] of Object.entries(CONVERSION_MAP)) {
      if (normalizedMime.startsWith(mime.split('/')[0] + '/')) {
        return formats.includes(normalizedFormat);
      }
    }
    return false;
  }
  
  return CONVERSION_MAP[normalizedMime].includes(normalizedFormat);
}

function getAvailableFormats(mimeType) {
  const normalizedMime = mimeType.toLowerCase();
  
  if (CONVERSION_MAP[normalizedMime]) {
    return CONVERSION_MAP[normalizedMime];
  }
  
  for (const [mime, formats] of Object.entries(CONVERSION_MAP)) {
    if (normalizedMime.startsWith(mime.split('/')[0] + '/')) {
      return formats;
    }
  }
  
  return [];
}

// Funções de conversão
async function convertImage(inputPath, outputPath, format) {
  await sharp(inputPath)
    .toFormat(format, { quality: 90 })
    .toFile(outputPath);
}

async function convertMedia(inputPath, outputPath, format, isVideo = false) {
  if (!toolsAvailable.ffmpeg) {
    throw new Error('FFmpeg não está instalado. Instale: sudo rpm-ostree install ffmpeg');
  }
  
  const safeInput = path.resolve(inputPath);
  const safeOutput = path.resolve(outputPath);
  
  const quality = isVideo ? "-crf 23" : "-q:a 2";
  const command = `ffmpeg -y -i "${safeInput}" ${quality} "${safeOutput}"`;
  
  console.log(`Executando: ${command}`);
  
  const { stderr } = await execAsync(command, { timeout: 300000 });
  
  if (!await fileExists(safeOutput)) {
    throw new Error(`Conversão falhou. FFmpeg: ${stderr}`);
  }
}

async function convertDocument(inputPath, outputPath, format) {
  const inputExt = path.extname(inputPath).toLowerCase();
  
  // PDF → TXT com pdftotext (preferencial)
  if (inputExt === '.pdf' && format === 'txt' && toolsAvailable.pdftotext) {
    const safeInput = path.resolve(inputPath);
    const safeOutput = path.resolve(outputPath);
    const command = `pdftotext "${safeInput}" "${safeOutput}"`;
    
    console.log(`Executando: ${command}`);
    await execAsync(command, { timeout: 120000 });
  } 
  // Outras conversões com LibreOffice
  else {
    if (!toolsAvailable.libreoffice) {
      throw new Error('LibreOffice não está instalado. Instale: sudo rpm-ostree install libreoffice');
    }
    
    const outputDir = path.dirname(path.resolve(outputPath));
    
    // LibreOffice precisa da extensão original para detectar o tipo
    // Criar cópia temporária com extensão correta
    const tempInputWithExt = inputPath + inputExt;
    await fs.copyFile(inputPath, tempInputWithExt);
    
    const sofficeCmd = toolsAvailable.libreoffice;
    const command = `${sofficeCmd} --headless --convert-to ${format} "${path.resolve(tempInputWithExt)}" --outdir "${outputDir}"`;
    
    console.log(`Executando: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 120000 });
      
      // Aguardar arquivo ser criado
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // LibreOffice pode criar o arquivo de várias formas:
      // 1. Com extensão: arquivo.txt
      // 2. Sem extensão: arquivo
      // 3. Nome original do input sem extensão + formato
      
      const baseName = path.basename(tempInputWithExt, inputExt);
      const possibleFiles = [
        path.join(outputDir, `${baseName}.${format}`),  // com extensão
        path.join(outputDir, baseName),                  // sem extensão
        path.join(outputDir, `${path.basename(inputPath)}.${format}`), // hash + formato
        path.join(outputDir, path.basename(inputPath))   // só hash
      ];
      
      let generatedFile = null;
      
      for (const candidate of possibleFiles) {
        console.log(`Verificando: ${candidate}`);
        if (await fileExists(candidate)) {
          generatedFile = candidate;
          console.log(`Arquivo encontrado: ${generatedFile}`);
          break;
        }
      }
      
      if (!generatedFile) {
        // Debug: listar todos os arquivos recentes
        const files = await fs.readdir(outputDir);
        const stats = await Promise.all(
          files.map(async f => ({
            name: f,
            path: path.join(outputDir, f),
            stats: await fs.stat(path.join(outputDir, f))
          }))
        );
        
        // Arquivos modificados nos últimos 5 segundos
        const now = Date.now();
        const recentFiles = stats.filter(f => now - f.stats.mtimeMs < 5000);
        
        console.log(`Arquivos recentes (últimos 5s):`, recentFiles.map(f => f.name));
        console.log(`STDOUT do LibreOffice:`, stdout);
        console.log(`STDERR do LibreOffice:`, stderr);
        
        throw new Error(`LibreOffice não gerou arquivo.  ${possibleFiles.join(', ')}`);
      }
      
      // Mover arquivo para o destino final
      console.log(`Movendo: ${generatedFile} → ${outputPath}`);
      await fs.rename(generatedFile, outputPath);
      
      // Limpar arquivo temporário
      await cleanupFile(tempInputWithExt);
      
    } catch (error) {
      // Limpar arquivo temporário mesmo em caso de erro
      await cleanupFile(tempInputWithExt);
      throw error;
    }
  }
  
  if (!await fileExists(outputPath)) {
    throw new Error("Arquivo convertido não foi criado");
  }
}

// Rotas
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    tools: toolsAvailable
  });
});

app.get("/tools", (req, res) => {
  res.json({
    available: toolsAvailable,
    instructions: {
      libreoffice: "sudo rpm-ostree install libreoffice",
      ffmpeg: "sudo rpm-ostree install ffmpeg",
      pdftotext: "sudo rpm-ostree install poppler-utils"
    }
  });
});

app.post("/available-formats", express.json(), (req, res) => {
  const { mimeType } = req.body;
  
  if (!mimeType) {
    return res.status(400).json({ error: "mimeType é obrigatório" });
  }
  
  const formats = getAvailableFormats(mimeType);
  res.json({ formats, mimeType });
});

app.post("/convert", upload.single("file"), async (req, res) => {
  let inputPath = null;
  let outputPath = null;
  let conversionSuccessful = false;

  try {
    const file = req.file;
    const format = req.body.format?.toLowerCase();

    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    if (!format) {
      await cleanupFile(file.path);
      return res.status(400).json({ error: "Formato não especificado." });
    }

    if (!/^[a-z0-9]+$/.test(format)) {
      await cleanupFile(file.path);
      return res.status(400).json({ error: "Formato inválido." });
    }

    const mime = file.mimetype;
    inputPath = file.path;

    if (!canConvert(mime, format)) {
      await cleanupFile(inputPath);
      const availableFormats = getAvailableFormats(mime);
      return res.status(400).json({ 
        error: `Não é possível converter ${mime} para ${format.toUpperCase()}`,
        availableFormats: availableFormats,
        suggestion: availableFormats.length > 0 
          ? `Formatos disponíveis: ${availableFormats.join(', ').toUpperCase()}`
          : 'Tipo de arquivo não suportado para conversão'
      });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    outputPath = path.join(UPLOAD_DIR, `converted-${timestamp}-${randomStr}.${format}`);

    console.log(`Convertendo: ${file.originalname} (${mime}) → ${format.toUpperCase()}`);

    if (mime.startsWith("image/")) {
      await convertImage(inputPath, outputPath, format);
    } 
    else if (mime.startsWith("audio/")) {
      await convertMedia(inputPath, outputPath, format, false);
    } 
    else if (mime.startsWith("video/")) {
      await convertMedia(inputPath, outputPath, format, true);
    } 
    else if (
      mime === "application/pdf" ||
      mime === "application/msword" ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/vnd.oasis.opendocument.text" ||
      mime === "text/plain" ||
      mime === "text/markdown" ||
      mime === "text/html"
    ) {
      await convertDocument(inputPath, outputPath, format);
    } 
    else {
      await cleanupFile(inputPath);
      return res.status(400).json({ error: "Tipo de arquivo não suportado." });
    }

    if (!await fileExists(outputPath)) {
      throw new Error("Arquivo convertido não foi gerado.");
    }

    conversionSuccessful = true;
    console.log(`Conversão concluída: ${outputPath}`);

    res.download(outputPath, `converted.${format}`, async (downloadErr) => {
      await cleanupFile(inputPath);
      
      if (downloadErr) {
        console.error("Erro ao enviar arquivo:", downloadErr.message);
      } else {
        console.log("Download concluído com sucesso");
      }
      
      await cleanupFile(outputPath);
    });

  } catch (error) {
    console.error("Erro na conversão:", error.message);
    
    await cleanupFile(inputPath);
    if (!conversionSuccessful) {
      await cleanupFile(outputPath);
    }
    
    res.status(500).json({ 
      error: error.message || "Erro ao converter o arquivo.",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`Diretório de uploads: ${path.resolve(UPLOAD_DIR)}`);
  } catch (err) {
    console.error("Erro ao criar diretório:", err);
    process.exit(1);
  }
}

app.listen(port, async () => {
  await ensureUploadDir();
  await checkTools();
  
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Limite de upload: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
});