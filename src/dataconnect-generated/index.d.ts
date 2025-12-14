import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface CreateFinancialGoalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateFinancialGoalVariables): MutationRef<CreateFinancialGoalData, CreateFinancialGoalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateFinancialGoalVariables): MutationRef<CreateFinancialGoalData, CreateFinancialGoalVariables>;
  operationName: string;
}
export const createFinancialGoalRef: CreateFinancialGoalRef;

export function createFinancialGoal(vars: CreateFinancialGoalVariables): MutationPromise<CreateFinancialGoalData, CreateFinancialGoalVariables>;
export function createFinancialGoal(dc: DataConnect, vars: CreateFinancialGoalVariables): MutationPromise<CreateFinancialGoalData, CreateFinancialGoalVariables>;

interface GetTransactionsForAccountRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTransactionsForAccountVariables): QueryRef<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetTransactionsForAccountVariables): QueryRef<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;
  operationName: string;
}
export const getTransactionsForAccountRef: GetTransactionsForAccountRef;

export function getTransactionsForAccount(vars: GetTransactionsForAccountVariables): QueryPromise<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;
export function getTransactionsForAccount(dc: DataConnect, vars: GetTransactionsForAccountVariables): QueryPromise<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;

interface UpdateCategoryIconRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCategoryIconVariables): MutationRef<UpdateCategoryIconData, UpdateCategoryIconVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCategoryIconVariables): MutationRef<UpdateCategoryIconData, UpdateCategoryIconVariables>;
  operationName: string;
}
export const updateCategoryIconRef: UpdateCategoryIconRef;

export function updateCategoryIcon(vars: UpdateCategoryIconVariables): MutationPromise<UpdateCategoryIconData, UpdateCategoryIconVariables>;
export function updateCategoryIcon(dc: DataConnect, vars: UpdateCategoryIconVariables): MutationPromise<UpdateCategoryIconData, UpdateCategoryIconVariables>;

interface ListBudgetsForUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListBudgetsForUserVariables): QueryRef<ListBudgetsForUserData, ListBudgetsForUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListBudgetsForUserVariables): QueryRef<ListBudgetsForUserData, ListBudgetsForUserVariables>;
  operationName: string;
}
export const listBudgetsForUserRef: ListBudgetsForUserRef;

export function listBudgetsForUser(vars: ListBudgetsForUserVariables): QueryPromise<ListBudgetsForUserData, ListBudgetsForUserVariables>;
export function listBudgetsForUser(dc: DataConnect, vars: ListBudgetsForUserVariables): QueryPromise<ListBudgetsForUserData, ListBudgetsForUserVariables>;

