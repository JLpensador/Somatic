# Somatic File Converter

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white)![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)

#### 🌐 Versão API (CloudConvert)

## Sumário

- [Sobre](#sobre)
- [Diferenças da Versão Local](#diferencas)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#prerequisitos)
- [Instalação](#instalacao)
- [Configuração](#configuracao)
- [Como Rodar](#rodar)
- [Estrutura de Pastas](#estrutura)
- [Endpoints da API](#endpoints)
- [Como Funciona](#funcionamento)
- [Limites e Créditos](#limites)
- [Exemplos de Uso](#exemplos)

## Sobre <a name="sobre"></a>

Um conversor de arquivos online desenvolvido com **Angular** (frontend) e **Node.js/Express** (backend) que utiliza a **API do CloudConvert** para conversões de documentos, áudio e vídeo, e **Sharp** para conversões locais de imagens.

Esta versão elimina a necessidade de instalar ferramentas como FFmpeg e LibreOffice no servidor, delegando as conversões complexas para a API do CloudConvert.

## Diferenças da Versão Local <a name="diferencas"></a>

| Característica | Versão Local (main) | Versão API (API) |
|----------------|---------------------|------------------|
| Conversão de Imagens | Sharp (local) | Sharp (local) ✅ |
| Conversão de Áudio/Vídeo | FFmpeg (instalação local) | CloudConvert API ☁️ |
| Conversão de Documentos | LibreOffice (instalação local) | CloudConvert API ☁️ |
| Dependências do Sistema | FFmpeg, LibreOffice, Poppler | Nenhuma ✅ |
| Custo | Gratuito | 25 conversões/dia grátis |
| Formatos Suportados | Limitado | 200+ formatos |
| Complexidade de Setup | Alta | Baixa ✅ |

## Funcionalidades <a name="funcionalidades"></a>

- ✅ Upload de arquivo via drag-and-drop ou seleção
- ✅ Conversão de **imagens** (local, grátis, ilimitado)
- ✅ Conversão de **documentos** (PDF, DOCX, TXT, etc.)
- ✅ Conversão de **áudio** (MP3, WAV, OGG, FLAC, etc.)
- ✅ Conversão de **vídeo** (MP4, AVI, MKV, MOV, etc.)
- ✅ Download automático do arquivo convertido
- ✅ Verificação de créditos disponíveis
- ✅ Zero dependências do sistema operacional

## Tecnologias <a name="tecnologias"></a>

**Backend:**
- Node.js + Express
- Sharp (conversão de imagens)
- CloudConvert SDK (documentos, áudio, vídeo)
- Multer (upload de arquivos)
- dotenv (variáveis de ambiente)

**Frontend:**
- Angular
- TypeScript
- RxJS

## Pré-requisitos <a name="prerequisitos"></a>

- Node.js 18+ 
- npm ou yarn
- Conta no CloudConvert (gratuita)

## Instalação <a name="instalacao"></a>

### 1. Clonar o repositório

```bash
git clone https://github.com/JLpensador/Somatic.git
cd Somatic
git checkout API
```

### 2. Instalar dependências do Backend

```bash
cd backend
npm install
```

### 3. Instalar dependências do Frontend

```bash
cd ../frontend
npm install
```

## Configuração <a name="configuracao"></a>

### Obter API Key do CloudConvert (Grátis)

1. Acesse: https://cloudconvert.com/register
2. Crie uma conta gratuita
3. Vá em: https://cloudconvert.com/dashboard/api/v2/keys
4. Clique em **"Create New API Key"**
5. Selecione as permissões: `tasks.read`, `tasks.write`, `jobs.read`, `jobs.write`
6. Copie a API key gerada

### Configurar variáveis de ambiente

```bash
cd backend
cp .env.example .env
nano .env
```

Preencha o arquivo `.env`:

```env
PORT=3000
NODE_ENV=development
CLOUDCONVERT_API_KEY=sua_api_key_aqui
MAX_FILE_SIZE_MB=50
```

## Como Rodar <a name="rodar"></a>

### Backend

```bash
cd backend
npm run dev
```

O backend ficará disponível em http://localhost:3000

### Frontend

```bash
cd frontend
ng serve
```

O frontend ficará disponível em http://localhost:4200

## Estrutura de Pastas <a name="estrutura"></a>

```
Somatic/
├── backend/
│   ├── src/
│   │   ├── server.js           # Entrada principal
│   │   ├── routes/
│   │   │   └── convert.js      # Rota de conversão
│   │   ├── services/
│   │   │   ├── imageService.js # Sharp (local)
│   │   │   └── cloudService.js # CloudConvert API
│   │   └── utils/
│   │       └── cleanup.js      # Limpeza de arquivos
│   ├── uploads/                # Arquivos temporários
│   ├── .env                    # Variáveis de ambiente
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   └── upload/
    │   │   └── services/
    │   │       └── file.service.ts
    │   └── main.ts
    └── package.json
```

## Endpoints da API <a name="endpoints"></a>

### `GET /health`
Verifica status do servidor e créditos disponíveis.

```bash
curl http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T23:08:53.185Z",
  "services": {
    "sharp": true,
    "cloudConvert": true
  },
  "cloudConvert": {
    "credits": 10,
    "email": "seu@email.com"
  }
}
```

### `GET /formats`
Lista formatos suportados por categoria.

```bash
curl http://localhost:3000/formats
```

### `POST /convert`
Converte um arquivo para o formato especificado.

**Parâmetros (multipart/form-data):**
- `file`: Arquivo a ser convertido
- `format`: Formato de saída (ex: `pdf`, `png`, `mp3`)

```bash
curl -X POST http://localhost:3000/convert \
  -F "file=@documento.docx" \
  -F "format=pdf" \
  --output documento.pdf
```

## Como Funciona <a name="funcionamento"></a>

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Sharp (local)  │  🖼️ Imagens
│   Angular   │     │   Express   │     └─────────────────┘
└─────────────┘     │             │     ┌─────────────────┐
                    │             │────▶│  CloudConvert   │  📄 Docs
                    │             │     │      API        │  🎵 Áudio
                    └─────────────┘     └─────────────────┘  🎬 Vídeo
```

1. Usuário seleciona arquivo e formato de saída
2. Frontend envia para `POST /convert`
3. Backend detecta o tipo do arquivo:
   - **Imagem → Imagem**: Usa Sharp (local, grátis)
   - **Outros**: Usa CloudConvert API
4. Arquivo convertido é retornado para download

## Limites e Créditos <a name="limites"></a>

### CloudConvert (Free Tier)
- **25 conversões/dia** gratuitas
- Créditos renovam diariamente
- Suficiente para uso pessoal/desenvolvimento

### Conversões Locais (Ilimitadas)
| De | Para |
|----|------|
| PNG, JPG, WEBP, GIF | PNG, JPG, WEBP, GIF, AVIF, TIFF |

### Conversões CloudConvert (1 crédito cada)
| Tipo | Formatos |
|------|----------|
| Documentos | PDF, DOCX, DOC, ODT, TXT, RTF, HTML, XLSX, CSV |
| Áudio | MP3, WAV, OGG, FLAC, AAC, M4A |
| Vídeo | MP4, AVI, MKV, MOV, WEBM |

## Exemplos de Uso <a name="exemplos"></a>

### Imagem (Local - Grátis)
```bash
# PNG → WebP
curl -X POST http://localhost:3000/convert \
  -F "file=@foto.png" \
  -F "format=webp" \
  --output foto.webp
```

### Documento (CloudConvert - 1 crédito)
```bash
# DOCX → PDF
curl -X POST http://localhost:3000/convert \
  -F "file=@relatorio.docx" \
  -F "format=pdf" \
  --output relatorio.pdf
```

### Áudio (CloudConvert - 1 crédito)
```bash
# WAV → MP3
curl -X POST http://localhost:3000/convert \
  -F "file=@musica.wav" \
  -F "format=mp3" \
  --output musica.mp3
```

### Vídeo (CloudConvert - 1 crédito)
```bash
# MOV → MP4
curl -X POST http://localhost:3000/convert \
  -F "file=@video.mov" \
  -F "format=mp4" \
  --output video.mp4
```

---
## 🤝 Contribuição

Contribuições são bem-vindas! Abra uma issue ou pull request.
