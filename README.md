# Somatic File Converter

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white)![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)

#### Versão Local com Node.js/Express

## Sumário

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Tecnologias utilizadas](#tecnologias)
- [Como rodar o projeto](#rodar)
- [Estrutura de Pastas](#estrutura)
- [Como funciona](#funcionamento)
- [Exemplos de uso](#exemplos)

## Sobre <a name = "sobre"></a>

Um conversor de arquivos online desenvolvido com **Angular** (frontend) e **Node.js/Express** (backend) que permite ao usuário enviar um arquivo, escolher um formato de saída, e receber o arquivo convertido para download. Suporta imagens, áudio, vídeo e documentos (dependendo da configuração do backend).

## Funcionalidades <a name = "funcionalidades"></a>

- Upload de arquivo via arrastar ou seleção de arquivo.  
- Seleção de formato de saída (ex: `.png`, `.jpg`, `.pdf`, `.mp3`, `.mp4`, etc).  
- Download automático do arquivo convertido com o mesmo nome original (mudando apenas a extensão).  
- Backend modular que detecta o tipo de arquivo e utiliza a ferramenta adequada para conversão (`sharp`, `ffmpeg`, `LibreOffice`, etc).  
- Mensagens de status para o usuário (arquivo selecionado, conversão concluída, erro).

### Tecnologias utilizadas <a name = "tecnologias"></a>

- Frontend: Angular  
- Backend: Node.js + Express  
- Upload de arquivos: `multer`  
- Conversão de imagem: `sharp`  
- Conversão de áudio/vídeo: `ffmpeg`  
- Conversão de documentos: `LibreOffice/soffice` (ou alternativa)  
- CORS: `cors`  

## Como rodar o projeto <a name = "rodar"></a>

### 1. Clonar o repositório  

```
git clone https://github.com/JLpensador/Somatic.git
cd Somatic
```

### 2. Rodar o Backend

```
cd backend
npm install
# Se for necessário, instale utilitários no sistema:
# sudo apt install ffmpeg libreoffice -y
node server.js
```

O backend ficará disponível em <http://localhost:3000>.

### 3. Rodar o Frontend

```
cd ../frontend
npm install
ng serve
```

Abra no navegador: <http://localhost:4200>.

## Estrutura de pastas <a name = "estrutura"></a>

```
Somatic/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── uploads/            # arquivos temporários de upload/conversão
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── upload/         # componente de upload/conversão
    │   │   │   └── result/
    │   │   ├── services/
    │   │   │   └── file.service.ts  # serviço que faz upload para o backend
    │   ├── main.ts
    │   └── app.module.ts
    └── package.json
```

## Como funciona <a name = "funcionamento"></a>

1. O usuário seleciona ou arrasta um arquivo no componente de upload.

2. É definida a extensão de saída desejada.

3. O frontend envia o arquivo + formato por FormData ao endpoint /convert.

4. O backend detecta o tipo MIME do arquivo (imagem, áudio, vídeo, documento) e aplica a ferramenta apropriada para converter.

5. O backend devolve o arquivo convertido como Blob.

6. O frontend gera o link de download automaticamente com o mesmo nome do arquivo original (ex: meuarquivo.jpg → meuarquivo.png).

7. Mensagens são exibidas para status/informação ao usuário.

## Exemplos de uso <a name = "exemplos"></a>

- Envie uma foto minhaFoto.jpg, escolha PNG → Baixe minhaFoto.png.

- Envie um áudio musica.wav, escolha MP3 → Baixe musica.mp3.

- Envie um documento relatorio.docx, escolha PDF → Baixe relatorio.pdf.

