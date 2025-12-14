import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface Account_Key {
  id: UUIDString;
  __typename?: 'Account_Key';
}

export interface Budget_Key {
  id: UUIDString;
  __typename?: 'Budget_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface CreateFinancialGoalData {
  financialGoal_insert: FinancialGoal_Key;
}

export interface CreateFinancialGoalVariables {
  userId: UUIDString;
  name: string;
  targetAmount: number;
  targetDate: DateString;
  goalType: string;
  description?: string | null;
}

export interface FinancialGoal_Key {
  id: UUIDString;
  __typename?: 'FinancialGoal_Key';
}

export interface GetTransactionsForAccountData {
  transactions: ({
    id: UUIDString;
    amount: number;
    transactionDate: DateString;
    description?: string | null;
  } & Transaction_Key)[];
}

export interface GetTransactionsForAccountVariables {
  accountId: UUIDString;
}

export interface ListBudgetsForUserData {
  budgets: ({
    id: UUIDString;
    name: string;
    budgetAmount: number;
    startDate: DateString;
    endDate: DateString;
  } & Budget_Key)[];
}

export interface ListBudgetsForUserVariables {
  userId: UUIDString;
}

export interface Transaction_Key {
  id: UUIDString;
  __typename?: 'Transaction_Key';
}

export interface UpdateCategoryIconData {
  category_update?: Category_Key | null;
}

export interface UpdateCategoryIconVariables {
  id: UUIDString;
  icon?: string | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'CreateFinancialGoal' Mutation. Allow users to execute without passing in DataConnect. */
export function createFinancialGoal(dc: DataConnect, vars: CreateFinancialGoalVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateFinancialGoalData>>;
/** Generated Node Admin SDK operation action function for the 'CreateFinancialGoal' Mutation. Allow users to pass in custom DataConnect instances. */
export function createFinancialGoal(vars: CreateFinancialGoalVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateFinancialGoalData>>;

/** Generated Node Admin SDK operation action function for the 'GetTransactionsForAccount' Query. Allow users to execute without passing in DataConnect. */
export function getTransactionsForAccount(dc: DataConnect, vars: GetTransactionsForAccountVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetTransactionsForAccountData>>;
/** Generated Node Admin SDK operation action function for the 'GetTransactionsForAccount' Query. Allow users to pass in custom DataConnect instances. */
export function getTransactionsForAccount(vars: GetTransactionsForAccountVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetTransactionsForAccountData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateCategoryIcon' Mutation. Allow users to execute without passing in DataConnect. */
export function updateCategoryIcon(dc: DataConnect, vars: UpdateCategoryIconVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateCategoryIconData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateCategoryIcon' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateCategoryIcon(vars: UpdateCategoryIconVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateCategoryIconData>>;

/** Generated Node Admin SDK operation action function for the 'ListBudgetsForUser' Query. Allow users to execute without passing in DataConnect. */
export function listBudgetsForUser(dc: DataConnect, vars: ListBudgetsForUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListBudgetsForUserData>>;
/** Generated Node Admin SDK operation action function for the 'ListBudgetsForUser' Query. Allow users to pass in custom DataConnect instances. */
export function listBudgetsForUser(vars: ListBudgetsForUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListBudgetsForUserData>>;

