import fs from "fs/promises";

export async function cleanupFile(filePath) {
  if (!filePath) return;

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`Removido: ${filePath}`);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Erro ao limpar ${filePath}:`, err.message);
    }
  }
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    console.error(`Erro ao criar diretório:`, err.message);
    throw err;
  }
}
