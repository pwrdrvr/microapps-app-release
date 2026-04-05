# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### MicroAppsAppRelease <a name="MicroAppsAppRelease" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease"></a>

- *Implements:* <a href="#@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease">IMicroAppsAppRelease</a>

Release app for MicroApps framework.

#### Initializers <a name="Initializers" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.Initializer"></a>

```typescript
import { MicroAppsAppRelease } from '@pwrdrvr/microapps-app-release-cdk'

new MicroAppsAppRelease(scope: Construct, id: string, props: MicroAppsAppReleaseProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.Initializer.parameter.props">props</a></code> | <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps">MicroAppsAppReleaseProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.Initializer.parameter.props"></a>

- *Type:* <a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps">MicroAppsAppReleaseProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.with">with</a></code> | Applies one or more mixins to this construct. |

---

##### `toString` <a name="toString" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

The mixins to apply.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.isConstruct"></a>

```typescript
import { MicroAppsAppRelease } from '@pwrdrvr/microapps-app-release-cdk'

MicroAppsAppRelease.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.property.lambdaFunction">lambdaFunction</a></code> | <code>aws-cdk-lib.aws_lambda.IFunction</code> | The Lambda function created. |

---

##### `node`<sup>Required</sup> <a name="node" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `lambdaFunction`<sup>Required</sup> <a name="lambdaFunction" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.property.lambdaFunction"></a>

```typescript
public readonly lambdaFunction: IFunction;
```

- *Type:* aws-cdk-lib.aws_lambda.IFunction

The Lambda function created.

---


## Structs <a name="Structs" id="Structs"></a>

### MicroAppsAppReleaseProps <a name="MicroAppsAppReleaseProps" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps"></a>

Properties to initialize an instance of `MicroAppsAppRelease`.

#### Initializer <a name="Initializer" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.Initializer"></a>

```typescript
import { MicroAppsAppReleaseProps } from '@pwrdrvr/microapps-app-release-cdk'

const microAppsAppReleaseProps: MicroAppsAppReleaseProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.property.table">table</a></code> | <code>aws-cdk-lib.aws_dynamodb.ITable</code> | DynamoDB table for data displayed / edited in the app. |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.property.functionName">functionName</a></code> | <code>string</code> | Name for the Lambda function. |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.property.nodeEnv">nodeEnv</a></code> | <code>string</code> | NODE_ENV to set on Lambda. |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | Removal Policy to pass to assets (e.g. Lambda function). |

---

##### `table`<sup>Required</sup> <a name="table" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.property.table"></a>

```typescript
public readonly table: ITable;
```

- *Type:* aws-cdk-lib.aws_dynamodb.ITable

DynamoDB table for data displayed / edited in the app.

This table is used by

---

##### `functionName`<sup>Optional</sup> <a name="functionName" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.property.functionName"></a>

```typescript
public readonly functionName: string;
```

- *Type:* string
- *Default:* auto-generated

Name for the Lambda function.

While this can be random, it's much easier to make it deterministic
so it can be computed for passing to `microapps-publish`.

---

##### `nodeEnv`<sup>Optional</sup> <a name="nodeEnv" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.property.nodeEnv"></a>

```typescript
public readonly nodeEnv: string;
```

- *Type:* string

NODE_ENV to set on Lambda.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy

Removal Policy to pass to assets (e.g. Lambda function).

---


## Protocols <a name="Protocols" id="Protocols"></a>

### IMicroAppsAppRelease <a name="IMicroAppsAppRelease" id="@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease"></a>

- *Implemented By:* <a href="#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease">MicroAppsAppRelease</a>, <a href="#@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease">IMicroAppsAppRelease</a>

Represents a Release app.


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease.property.lambdaFunction">lambdaFunction</a></code> | <code>aws-cdk-lib.aws_lambda.IFunction</code> | The Lambda function created. |

---

##### `lambdaFunction`<sup>Required</sup> <a name="lambdaFunction" id="@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease.property.lambdaFunction"></a>

```typescript
public readonly lambdaFunction: IFunction;
```

- *Type:* aws-cdk-lib.aws_lambda.IFunction

The Lambda function created.

---

