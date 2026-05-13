import { Component, ViewChild, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp,
    IonRouterOutlet
  ]
})
export class AppComponent {
  @ViewChild(IonRouterOutlet, { static: true })
  private routerOutlet!: IonRouterOutlet;

  private platform = inject(Platform);

  constructor() {
    this.initializeApp();
  }

  private initializeApp() {
    this.platform.ready().then(() => {
      this.configurarBotonAtrasAndroid();
    });
  }

  private configurarBotonAtrasAndroid() {
    this.platform.backButton.subscribeWithPriority(10, async () => {
      if (this.routerOutlet?.canGoBack()) {
        await this.routerOutlet.pop();
        return;
      }

      await App.exitApp();
    });
  }
}