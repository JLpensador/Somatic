import { Component } from '@angular/core';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.html',
  styleUrls: ['./upload.scss'],
  standalone: false
})
export class Upload {
  selectedFile!: File;
  selectedFormat = 'png';
  message = '';

  constructor(private fileService: FileService) { }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit() {
    if (!this.selectedFile) {
      this.message = 'Selecione um arquivo primeiro.';
      return;
    }

    this.fileService.uploadFile(this.selectedFile, this.selectedFormat).subscribe({
      next: (blob) => {
        const originalName = this.selectedFile.name.split('.').slice(0, -1).join('.');
        const newFileName = `${originalName}.${this.selectedFormat}`;
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = newFileName;
        link.click();
        this.message = `Arquivo convertido com sucesso: ${newFileName}`;
      },
      error: () => {
        this.message = 'Erro ao converter o arquivo.';
      },
    });
  }
}
