import { Component } from '@angular/core';
import { VendasPendentesComponent } from './vendas-pendentes/vendas-pendentes.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VendasPendentesComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}