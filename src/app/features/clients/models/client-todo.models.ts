export type ClientTodoPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type ClientTodoStatus = 'Open' | 'InProgress' | 'Completed' | 'Cancelled';

export interface ClientTodoUser {
  readonly id: string;
  readonly displayName: string;
}
export interface ClientTodo {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly assignedTo: ClientTodoUser;
  readonly dueDate: string | null;
  readonly priority: ClientTodoPriority;
  readonly status: ClientTodoStatus;
  readonly isOverdue: boolean;
  readonly createdBy: ClientTodoUser;
  readonly createdAtUtc: string;
  readonly updatedAtUtc: string;
  readonly completedAtUtc: string | null;
  readonly editorVersion: string;
}
export interface SaveClientTodoRequest {
  readonly title: string;
  readonly description: string | null;
  readonly assignedToUserId: string;
  readonly dueDate: string | null;
  readonly priority: ClientTodoPriority;
  readonly editorVersion?: string;
}
