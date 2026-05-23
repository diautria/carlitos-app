import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, person, settings } from 'ionicons/icons';
import { FamiliaMiembrosService } from '../services/familia-miembros.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, NgIf],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  private familiaMiembrosService = inject(FamiliaMiembrosService);

  esAdminFamilia = false;

  constructor() {
    addIcons({ person, calendar, settings });
  }

  async ngOnInit() {
    await this.cargarPermisosFamilia();
  }

  async ionViewWillEnter() {
    await this.cargarPermisosFamilia();
  }

  private async cargarPermisosFamilia() {
    try {
      this.esAdminFamilia = await this.familiaMiembrosService.esUsuarioAdmin();
    } catch (error) {
      console.error('Error cargando permisos en tabs', error);
      this.esAdminFamilia = false;
    }
  }
}
