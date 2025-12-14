const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'example',
  serviceId: 'ovomonie-v1',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

function createFinancialGoal(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateFinancialGoal', inputVars, inputOpts);
}
exports.createFinancialGoal = createFinancialGoal;

function getTransactionsForAccount(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetTransactionsForAccount', inputVars, inputOpts);
}
exports.getTransactionsForAccount = getTransactionsForAccount;

function updateCategoryIcon(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateCategoryIcon', inputVars, inputOpts);
}
exports.updateCategoryIcon = updateCategoryIcon;

function listBudgetsForUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListBudgetsForUser', inputVars, inputOpts);
}
exports.listBudgetsForUser = listBudgetsForUser;

