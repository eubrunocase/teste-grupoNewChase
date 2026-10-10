import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ResumoLoja,
  ResultadoLote,
  StatusVenda,
  VendaPendente,
} from './vendas-pendentes.model';

// A API do backend expõe os endpoints sob /api (CORS já habilitado no servidor).
const API_URL = 'http://localhost:3000/api/vendas-pendentes';

@Injectable({ providedIn: 'root' })
export class VendasPendentesService {
  constructor(private readonly http: HttpClient) {}

  listar(filtros: Record<string, string>): Observable<VendaPendente[]> {
    return this.http.get<VendaPendente[]>(API_URL, { params: filtros });
  }

  resumo(filtros: Record<string, string>): Observable<ResumoLoja[]> {
    return this.http.get<ResumoLoja[]>(`${API_URL}/resumo`, { params: filtros });
  }

  atualizarLote(ids: number[], novoStatus: StatusVenda): Observable<ResultadoLote> {
    return this.http.post<ResultadoLote>(`${API_URL}/lote/atualizar-status`, {
      ids,
      novoStatus,
    });
  }

  atualizarStatus(id: number, novoStatus: StatusVenda): Observable<VendaPendente> {
    return this.http.patch<VendaPendente>(`${API_URL}/${id}/status`, {
      status: novoStatus,
    });
  }
}