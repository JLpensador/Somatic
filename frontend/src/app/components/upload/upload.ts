import { Component, OnInit } from '@angular/core';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.html',
  styleUrls: ['./upload.scss'],
  standalone: false
})
export class Upload implements OnInit {
  selectedFile!: File;
  selectedFormat = 'png';
  message = '';
  isLoading = false;
  credits: number | null = null;

  constructor(private fileService: FileService) { }

  ngOnInit() {
    this.checkHealth();
  }

  checkHealth() {
    this.fileService.getHealth().subscribe({
      next: (health) => {
        if (health.cloudConvert?.credits !== undefined) {
          this.credits = health.cloudConvert.credits;
        }
      },
      error: (err) => console.error('Erro ao verificar saúde:', err)
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.message = '';
    }
  }

  onSubmit() {
    if (!this.selectedFile) {
      this.message = 'Selecione um arquivo primeiro.';
      return;
    }

    if (!this.selectedFormat) {
      this.message = 'Por favor, selecione um formato de saída.';
      return;
    }

    this.isLoading = true;
    this.message = 'Convertendo arquivo...';

    this.fileService.uploadFile(this.selectedFile, this.selectedFormat).subscribe({
      next: (blob) => {
        const originalName = this.selectedFile.name.split('.').slice(0, -1).join('.');
        const newFileName = `${originalName}.${this.selectedFormat}`;
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = newFileName;
        link.click();
        window.URL.revokeObjectURL(link.href);

        this.message = 'Arquivo convertido: ${newFileName}';
        this.isLoading = false;
        this.checkHealth(); //atuaizar créditos após conversão
      },
      error: (err) => {
        console.error('Erro:', err);
        this.message = 'Erro ao converter o arquivo.';
        this.isLoading = false;
      },
    })

  }
}
