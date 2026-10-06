import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/app-config';
import { ClientTodo } from '../models/client-todo.models';
import { ClientTodoApiService } from './client-todo-api.service';

describe('ClientTodoApiService', () => {
  let api: ClientTodoApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(ClientTodoApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses client-scoped endpoints and carries editorVersion for transitions', () => {
    api.list('client 1').subscribe();
    expect(http.expectOne('/api/clients/client%201/todos').request.method).toBe('GET');
    api.transition('client 1', todo(), 'complete').subscribe();
    const request = http.expectOne('/api/clients/client%201/todos/todo-1/complete');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ editorVersion: 'A'.repeat(64) });
    request.flush(todo());
  });

  it('creates Open todos without sending a status', () => {
    api
      .create('client-1', {
        title: 'Task',
        description: null,
        assignedToUserId: 'user-1',
        dueDate: null,
        priority: 'Normal',
      })
      .subscribe();
    const request = http.expectOne('/api/clients/client-1/todos');
    expect(request.request.body.status).toBeUndefined();
    expect(request.request.body.priority).toBe('Normal');
    request.flush(todo());
  });
});

function todo(): ClientTodo {
  return {
    id: 'todo-1',
    title: 'Task',
    description: '',
    assignedTo: { id: 'user-1', displayName: 'User One' },
    dueDate: null,
    priority: 'Normal',
    status: 'Open',
    isOverdue: false,
    createdBy: { id: 'user-1', displayName: 'User One' },
    createdAtUtc: '2026-09-04T00:00:00Z',
    updatedAtUtc: '2026-09-04T00:00:00Z',
    completedAtUtc: null,
    editorVersion: 'A'.repeat(64),
  };
}
