import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:3000/convert';

  constructor(private http: HttpClient) { }

  uploadFile(file: File, format: string): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    return this.http.post(this.apiUrl, formData, { responseType: 'blob' });
  }
}
