import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HealthResponse {
  status: string;
  services: {
    sharp: boolean;
    cloudConvert: boolean;
  };
  cloudConvert?: {
    credits?: number;
    email?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  uploadFile(file: File, format: string): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    return this.http.post(`${this.apiUrl}/convert`, formData, { responseType: 'blob' });
  }

  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiUrl}/health`);
  }
}
