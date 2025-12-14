const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'ovomonie-v1',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createFinancialGoalRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateFinancialGoal', inputVars);
}
createFinancialGoalRef.operationName = 'CreateFinancialGoal';
exports.createFinancialGoalRef = createFinancialGoalRef;

exports.createFinancialGoal = function createFinancialGoal(dcOrVars, vars) {
  return executeMutation(createFinancialGoalRef(dcOrVars, vars));
};

const getTransactionsForAccountRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetTransactionsForAccount', inputVars);
}
getTransactionsForAccountRef.operationName = 'GetTransactionsForAccount';
exports.getTransactionsForAccountRef = getTransactionsForAccountRef;

exports.getTransactionsForAccount = function getTransactionsForAccount(dcOrVars, vars) {
  return executeQuery(getTransactionsForAccountRef(dcOrVars, vars));
};

const updateCategoryIconRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateCategoryIcon', inputVars);
}
updateCategoryIconRef.operationName = 'UpdateCategoryIcon';
exports.updateCategoryIconRef = updateCategoryIconRef;

exports.updateCategoryIcon = function updateCategoryIcon(dcOrVars, vars) {
  return executeMutation(updateCategoryIconRef(dcOrVars, vars));
};

const listBudgetsForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBudgetsForUser', inputVars);
}
listBudgetsForUserRef.operationName = 'ListBudgetsForUser';
exports.listBudgetsForUserRef = listBudgetsForUserRef;

exports.listBudgetsForUser = function listBudgetsForUser(dcOrVars, vars) {
  return executeQuery(listBudgetsForUserRef(dcOrVars, vars));
};
