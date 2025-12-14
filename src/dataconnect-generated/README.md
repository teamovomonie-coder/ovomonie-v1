# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetTransactionsForAccount*](#gettransactionsforaccount)
  - [*ListBudgetsForUser*](#listbudgetsforuser)
- [**Mutations**](#mutations)
  - [*CreateFinancialGoal*](#createfinancialgoal)
  - [*UpdateCategoryIcon*](#updatecategoryicon)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetTransactionsForAccount
You can execute the `GetTransactionsForAccount` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getTransactionsForAccount(vars: GetTransactionsForAccountVariables): QueryPromise<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;

interface GetTransactionsForAccountRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTransactionsForAccountVariables): QueryRef<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;
}
export const getTransactionsForAccountRef: GetTransactionsForAccountRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTransactionsForAccount(dc: DataConnect, vars: GetTransactionsForAccountVariables): QueryPromise<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;

interface GetTransactionsForAccountRef {
  ...
  (dc: DataConnect, vars: GetTransactionsForAccountVariables): QueryRef<GetTransactionsForAccountData, GetTransactionsForAccountVariables>;
}
export const getTransactionsForAccountRef: GetTransactionsForAccountRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTransactionsForAccountRef:
```typescript
const name = getTransactionsForAccountRef.operationName;
console.log(name);
```

### Variables
The `GetTransactionsForAccount` query requires an argument of type `GetTransactionsForAccountVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetTransactionsForAccountVariables {
  accountId: UUIDString;
}
```
### Return Type
Recall that executing the `GetTransactionsForAccount` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTransactionsForAccountData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetTransactionsForAccountData {
  transactions: ({
    id: UUIDString;
    amount: number;
    transactionDate: DateString;
    description?: string | null;
  } & Transaction_Key)[];
}
```
### Using `GetTransactionsForAccount`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTransactionsForAccount, GetTransactionsForAccountVariables } from '@dataconnect/generated';

// The `GetTransactionsForAccount` query requires an argument of type `GetTransactionsForAccountVariables`:
const getTransactionsForAccountVars: GetTransactionsForAccountVariables = {
  accountId: ..., 
};

// Call the `getTransactionsForAccount()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTransactionsForAccount(getTransactionsForAccountVars);
// Variables can be defined inline as well.
const { data } = await getTransactionsForAccount({ accountId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTransactionsForAccount(dataConnect, getTransactionsForAccountVars);

console.log(data.transactions);

// Or, you can use the `Promise` API.
getTransactionsForAccount(getTransactionsForAccountVars).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

### Using `GetTransactionsForAccount`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTransactionsForAccountRef, GetTransactionsForAccountVariables } from '@dataconnect/generated';

// The `GetTransactionsForAccount` query requires an argument of type `GetTransactionsForAccountVariables`:
const getTransactionsForAccountVars: GetTransactionsForAccountVariables = {
  accountId: ..., 
};

// Call the `getTransactionsForAccountRef()` function to get a reference to the query.
const ref = getTransactionsForAccountRef(getTransactionsForAccountVars);
// Variables can be defined inline as well.
const ref = getTransactionsForAccountRef({ accountId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTransactionsForAccountRef(dataConnect, getTransactionsForAccountVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.transactions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

## ListBudgetsForUser
You can execute the `ListBudgetsForUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listBudgetsForUser(vars: ListBudgetsForUserVariables): QueryPromise<ListBudgetsForUserData, ListBudgetsForUserVariables>;

interface ListBudgetsForUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListBudgetsForUserVariables): QueryRef<ListBudgetsForUserData, ListBudgetsForUserVariables>;
}
export const listBudgetsForUserRef: ListBudgetsForUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listBudgetsForUser(dc: DataConnect, vars: ListBudgetsForUserVariables): QueryPromise<ListBudgetsForUserData, ListBudgetsForUserVariables>;

interface ListBudgetsForUserRef {
  ...
  (dc: DataConnect, vars: ListBudgetsForUserVariables): QueryRef<ListBudgetsForUserData, ListBudgetsForUserVariables>;
}
export const listBudgetsForUserRef: ListBudgetsForUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listBudgetsForUserRef:
```typescript
const name = listBudgetsForUserRef.operationName;
console.log(name);
```

### Variables
The `ListBudgetsForUser` query requires an argument of type `ListBudgetsForUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListBudgetsForUserVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `ListBudgetsForUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListBudgetsForUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListBudgetsForUserData {
  budgets: ({
    id: UUIDString;
    name: string;
    budgetAmount: number;
    startDate: DateString;
    endDate: DateString;
  } & Budget_Key)[];
}
```
### Using `ListBudgetsForUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listBudgetsForUser, ListBudgetsForUserVariables } from '@dataconnect/generated';

// The `ListBudgetsForUser` query requires an argument of type `ListBudgetsForUserVariables`:
const listBudgetsForUserVars: ListBudgetsForUserVariables = {
  userId: ..., 
};

// Call the `listBudgetsForUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBudgetsForUser(listBudgetsForUserVars);
// Variables can be defined inline as well.
const { data } = await listBudgetsForUser({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listBudgetsForUser(dataConnect, listBudgetsForUserVars);

console.log(data.budgets);

// Or, you can use the `Promise` API.
listBudgetsForUser(listBudgetsForUserVars).then((response) => {
  const data = response.data;
  console.log(data.budgets);
});
```

### Using `ListBudgetsForUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listBudgetsForUserRef, ListBudgetsForUserVariables } from '@dataconnect/generated';

// The `ListBudgetsForUser` query requires an argument of type `ListBudgetsForUserVariables`:
const listBudgetsForUserVars: ListBudgetsForUserVariables = {
  userId: ..., 
};

// Call the `listBudgetsForUserRef()` function to get a reference to the query.
const ref = listBudgetsForUserRef(listBudgetsForUserVars);
// Variables can be defined inline as well.
const ref = listBudgetsForUserRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listBudgetsForUserRef(dataConnect, listBudgetsForUserVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.budgets);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.budgets);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateFinancialGoal
You can execute the `CreateFinancialGoal` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createFinancialGoal(vars: CreateFinancialGoalVariables): MutationPromise<CreateFinancialGoalData, CreateFinancialGoalVariables>;

interface CreateFinancialGoalRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateFinancialGoalVariables): MutationRef<CreateFinancialGoalData, CreateFinancialGoalVariables>;
}
export const createFinancialGoalRef: CreateFinancialGoalRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createFinancialGoal(dc: DataConnect, vars: CreateFinancialGoalVariables): MutationPromise<CreateFinancialGoalData, CreateFinancialGoalVariables>;

interface CreateFinancialGoalRef {
  ...
  (dc: DataConnect, vars: CreateFinancialGoalVariables): MutationRef<CreateFinancialGoalData, CreateFinancialGoalVariables>;
}
export const createFinancialGoalRef: CreateFinancialGoalRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createFinancialGoalRef:
```typescript
const name = createFinancialGoalRef.operationName;
console.log(name);
```

### Variables
The `CreateFinancialGoal` mutation requires an argument of type `CreateFinancialGoalVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateFinancialGoalVariables {
  userId: UUIDString;
  name: string;
  targetAmount: number;
  targetDate: DateString;
  goalType: string;
  description?: string | null;
}
```
### Return Type
Recall that executing the `CreateFinancialGoal` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateFinancialGoalData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateFinancialGoalData {
  financialGoal_insert: FinancialGoal_Key;
}
```
### Using `CreateFinancialGoal`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createFinancialGoal, CreateFinancialGoalVariables } from '@dataconnect/generated';

// The `CreateFinancialGoal` mutation requires an argument of type `CreateFinancialGoalVariables`:
const createFinancialGoalVars: CreateFinancialGoalVariables = {
  userId: ..., 
  name: ..., 
  targetAmount: ..., 
  targetDate: ..., 
  goalType: ..., 
  description: ..., // optional
};

// Call the `createFinancialGoal()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createFinancialGoal(createFinancialGoalVars);
// Variables can be defined inline as well.
const { data } = await createFinancialGoal({ userId: ..., name: ..., targetAmount: ..., targetDate: ..., goalType: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createFinancialGoal(dataConnect, createFinancialGoalVars);

console.log(data.financialGoal_insert);

// Or, you can use the `Promise` API.
createFinancialGoal(createFinancialGoalVars).then((response) => {
  const data = response.data;
  console.log(data.financialGoal_insert);
});
```

### Using `CreateFinancialGoal`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createFinancialGoalRef, CreateFinancialGoalVariables } from '@dataconnect/generated';

// The `CreateFinancialGoal` mutation requires an argument of type `CreateFinancialGoalVariables`:
const createFinancialGoalVars: CreateFinancialGoalVariables = {
  userId: ..., 
  name: ..., 
  targetAmount: ..., 
  targetDate: ..., 
  goalType: ..., 
  description: ..., // optional
};

// Call the `createFinancialGoalRef()` function to get a reference to the mutation.
const ref = createFinancialGoalRef(createFinancialGoalVars);
// Variables can be defined inline as well.
const ref = createFinancialGoalRef({ userId: ..., name: ..., targetAmount: ..., targetDate: ..., goalType: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createFinancialGoalRef(dataConnect, createFinancialGoalVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.financialGoal_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.financialGoal_insert);
});
```

## UpdateCategoryIcon
You can execute the `UpdateCategoryIcon` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateCategoryIcon(vars: UpdateCategoryIconVariables): MutationPromise<UpdateCategoryIconData, UpdateCategoryIconVariables>;

interface UpdateCategoryIconRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCategoryIconVariables): MutationRef<UpdateCategoryIconData, UpdateCategoryIconVariables>;
}
export const updateCategoryIconRef: UpdateCategoryIconRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCategoryIcon(dc: DataConnect, vars: UpdateCategoryIconVariables): MutationPromise<UpdateCategoryIconData, UpdateCategoryIconVariables>;

interface UpdateCategoryIconRef {
  ...
  (dc: DataConnect, vars: UpdateCategoryIconVariables): MutationRef<UpdateCategoryIconData, UpdateCategoryIconVariables>;
}
export const updateCategoryIconRef: UpdateCategoryIconRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCategoryIconRef:
```typescript
const name = updateCategoryIconRef.operationName;
console.log(name);
```

### Variables
The `UpdateCategoryIcon` mutation requires an argument of type `UpdateCategoryIconVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCategoryIconVariables {
  id: UUIDString;
  icon?: string | null;
}
```
### Return Type
Recall that executing the `UpdateCategoryIcon` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCategoryIconData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCategoryIconData {
  category_update?: Category_Key | null;
}
```
### Using `UpdateCategoryIcon`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCategoryIcon, UpdateCategoryIconVariables } from '@dataconnect/generated';

// The `UpdateCategoryIcon` mutation requires an argument of type `UpdateCategoryIconVariables`:
const updateCategoryIconVars: UpdateCategoryIconVariables = {
  id: ..., 
  icon: ..., // optional
};

// Call the `updateCategoryIcon()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCategoryIcon(updateCategoryIconVars);
// Variables can be defined inline as well.
const { data } = await updateCategoryIcon({ id: ..., icon: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCategoryIcon(dataConnect, updateCategoryIconVars);

console.log(data.category_update);

// Or, you can use the `Promise` API.
updateCategoryIcon(updateCategoryIconVars).then((response) => {
  const data = response.data;
  console.log(data.category_update);
});
```

### Using `UpdateCategoryIcon`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCategoryIconRef, UpdateCategoryIconVariables } from '@dataconnect/generated';

// The `UpdateCategoryIcon` mutation requires an argument of type `UpdateCategoryIconVariables`:
const updateCategoryIconVars: UpdateCategoryIconVariables = {
  id: ..., 
  icon: ..., // optional
};

// Call the `updateCategoryIconRef()` function to get a reference to the mutation.
const ref = updateCategoryIconRef(updateCategoryIconVars);
// Variables can be defined inline as well.
const ref = updateCategoryIconRef({ id: ..., icon: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCategoryIconRef(dataConnect, updateCategoryIconVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.category_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.category_update);
});
```

