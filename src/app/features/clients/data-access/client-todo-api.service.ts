import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/app-config';
import { ClientTodo, ClientTodoUser, SaveClientTodoRequest } from '../models/client-todo.models';

@Injectable({ providedIn: 'root' })
export class ClientTodoApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(clientId: string): Observable<readonly ClientTodo[]> {
    return this.http.get<readonly ClientTodo[]>(this.url(clientId));
  }
  assignees(clientId: string): Observable<readonly ClientTodoUser[]> {
    return this.http.get<readonly ClientTodoUser[]>(`${this.url(clientId)}/assignees`);
  }
  create(clientId: string, request: SaveClientTodoRequest): Observable<ClientTodo> {
    return this.http.post<ClientTodo>(this.url(clientId), request);
  }
  update(clientId: string, todoId: string, request: SaveClientTodoRequest): Observable<ClientTodo> {
    return this.http.put<ClientTodo>(`${this.url(clientId)}/${encodeURIComponent(todoId)}`, request);
  }
  transition(clientId: string, todo: ClientTodo, action: 'complete' | 'reopen' | 'cancel'): Observable<ClientTodo> {
    return this.http.post<ClientTodo>(`${this.url(clientId)}/${encodeURIComponent(todo.id)}/${action}`,
      { editorVersion: todo.editorVersion });
  }
  private url(clientId: string): string {
    return `${this.apiBaseUrl}/clients/${encodeURIComponent(clientId)}/todos`;
  }
}
