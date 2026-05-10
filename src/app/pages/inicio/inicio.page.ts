import { Component, inject, OnInit } from '@angular/core';
import {
  IonContent,
  IonSpinner,
  IonText, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, 
    IonContent,
    IonSpinner,
    IonText
  ]
})
export class InicioPage implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  ngOnInit() {
    onAuthStateChanged(this.auth, async usuario => {
      if (!usuario) {
        await this.router.navigateByUrl('/login', { replaceUrl: true });
        return;
      }

      const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);
      const usuarioSnap = await getDoc(usuarioRef);

      if (!usuarioSnap.exists()) {
        await this.router.navigateByUrl('/login', { replaceUrl: true });
        return;
      }

      const usuarioData = usuarioSnap.data();

      if (usuarioData['familiaActivaId']) {
        await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      } else {
        await this.router.navigateByUrl('/familia-inicial', { replaceUrl: true });
      }
    });
  }
}