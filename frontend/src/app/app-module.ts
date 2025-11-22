import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Upload } from './components/upload/upload';

import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Header } from './components/header/header';
import { Links } from './components/links/links';

@NgModule({
  declarations: [
    App,
    Upload,
    Header,
    Links
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [App]
})
export class AppModule { }
