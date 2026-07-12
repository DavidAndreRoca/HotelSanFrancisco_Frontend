// sockjs-client espera `global` (Node). Polyfill antes de cualquier import que lo use.
(window as unknown as { global: Window }).global = window;

import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Los pipes de moneda/decimal usan el locale 'es-PE' (formato de soles S/).
// Angular no trae los datos de locale por defecto: sin este registro,
// CurrencyPipe/DecimalPipe lanzan NG0701 y rompen las tarjetas del dashboard.
registerLocaleData(localeEsPe, 'es-PE');

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
