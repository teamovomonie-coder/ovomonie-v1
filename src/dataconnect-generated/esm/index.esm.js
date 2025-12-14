import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'ovomonie-v1',
  location: 'us-east4'
};

export const createFinancialGoalRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateFinancialGoal', inputVars);
}
createFinancialGoalRef.operationName = 'CreateFinancialGoal';

export function createFinancialGoal(dcOrVars, vars) {
  return executeMutation(createFinancialGoalRef(dcOrVars, vars));
}

export const getTransactionsForAccountRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetTransactionsForAccount', inputVars);
}
getTransactionsForAccountRef.operationName = 'GetTransactionsForAccount';

export function getTransactionsForAccount(dcOrVars, vars) {
  return executeQuery(getTransactionsForAccountRef(dcOrVars, vars));
}

export const updateCategoryIconRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateCategoryIcon', inputVars);
}
updateCategoryIconRef.operationName = 'UpdateCategoryIcon';

export function updateCategoryIcon(dcOrVars, vars) {
  return executeMutation(updateCategoryIconRef(dcOrVars, vars));
}

export const listBudgetsForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBudgetsForUser', inputVars);
}
listBudgetsForUserRef.operationName = 'ListBudgetsForUser';

export function listBudgetsForUser(dcOrVars, vars) {
  return executeQuery(listBudgetsForUserRef(dcOrVars, vars));
}

