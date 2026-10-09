import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-vendas-pendentes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vendas-pendentes.component.html',
})
export class VendasPendentesComponent implements OnInit {
  vendas: any[] = [];
  selecionadas = new Set<number>();

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/vendas-pendentes').subscribe((data) => (this.vendas = data));
  }

  toggle(id: number) {
    this.selecionadas.has(id) ? this.selecionadas.delete(id) : this.selecionadas.add(id);
  }

  faturarSelecionadas() {
    this.http
      .post('http://localhost:3000/api/vendas-pendentes/lote/atualizar-status', {
        ids: Array.from(this.selecionadas),
        novoStatus: 'FATURADO',
      })
      .subscribe(() => this.ngOnInit());
  }
}
