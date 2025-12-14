import { CreateFinancialGoalData, CreateFinancialGoalVariables, GetTransactionsForAccountData, GetTransactionsForAccountVariables, UpdateCategoryIconData, UpdateCategoryIconVariables, ListBudgetsForUserData, ListBudgetsForUserVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateFinancialGoal(options?: useDataConnectMutationOptions<CreateFinancialGoalData, FirebaseError, CreateFinancialGoalVariables>): UseDataConnectMutationResult<CreateFinancialGoalData, CreateFinancialGoalVariables>;
export function useCreateFinancialGoal(dc: DataConnect, options?: useDataConnectMutationOptions<CreateFinancialGoalData, FirebaseError, CreateFinancialGoalVariables>): UseDataConnectMutationResult<CreateFinancialGoalData, CreateFinancialGoalVariables>;

export function useGetTransactionsForAccount(vars: GetTransactionsForAccountVariables, options?: useDataConnectQueryOptions<GetTransactionsForAccountData>): UseDataConnectQueryResult<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;
export function useGetTransactionsForAccount(dc: DataConnect, vars: GetTransactionsForAccountVariables, options?: useDataConnectQueryOptions<GetTransactionsForAccountData>): UseDataConnectQueryResult<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;

export function useUpdateCategoryIcon(options?: useDataConnectMutationOptions<UpdateCategoryIconData, FirebaseError, UpdateCategoryIconVariables>): UseDataConnectMutationResult<UpdateCategoryIconData, UpdateCategoryIconVariables>;
export function useUpdateCategoryIcon(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCategoryIconData, FirebaseError, UpdateCategoryIconVariables>): UseDataConnectMutationResult<UpdateCategoryIconData, UpdateCategoryIconVariables>;

export function useListBudgetsForUser(vars: ListBudgetsForUserVariables, options?: useDataConnectQueryOptions<ListBudgetsForUserData>): UseDataConnectQueryResult<ListBudgetsForUserData, ListBudgetsForUserVariables>;
export function useListBudgetsForUser(dc: DataConnect, vars: ListBudgetsForUserVariables, options?: useDataConnectQueryOptions<ListBudgetsForUserData>): UseDataConnectQueryResult<ListBudgetsForUserData, ListBudgetsForUserVariables>;
