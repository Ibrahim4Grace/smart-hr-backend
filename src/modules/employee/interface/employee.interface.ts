export interface EmployeeFilterOptions {
    page: number;
    limit: number;
    sort: string;
    order: 'asc' | 'desc';
    status?: string;
    createdDate?: string;
    dueDate?: string;
}
export interface EmployeeDashboard {
    totalEmployees: number;
    active: number;
    inactive: number;
    onLeave: number;
    deactivated: number;
    onProbation: number;
}
