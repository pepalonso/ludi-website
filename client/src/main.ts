import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { AppComponent } from './app/app.component'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [...(appConfig.providers || []), provideHttpClient(withInterceptorsFromDi())],
}).catch(err => console.error(err))
