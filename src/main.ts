// sockjs-client espera `global` (Node). Polyfill antes de cualquier import que lo use.
(window as unknown as { global: Window }).global = window;

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
