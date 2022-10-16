# API Reference <a name="API Reference"></a>

## Constructs <a name="Constructs"></a>

### MicroAppsAppRelease <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease"></a>

- *Implements:* [`@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease`](#@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease)

Release app for MicroApps framework.

#### Initializer <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.Initializer"></a>

```typescript
import { MicroAppsAppRelease } from '@pwrdrvr/microapps-app-release-cdk'

new MicroAppsAppRelease(scope: Construct, id: string, props: MicroAppsAppReleaseProps)
```

##### `scope`<sup>Required</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.scope"></a>

- *Type:* [`constructs.Construct`](#constructs.Construct)

---

##### `id`<sup>Required</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.id"></a>

- *Type:* `string`

---

##### `props`<sup>Required</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.props"></a>

- *Type:* [`@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps`](#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps)

---



#### Properties <a name="Properties"></a>

##### `lambdaFunction`<sup>Required</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease.lambdaFunction"></a>

- *Type:* [`aws-cdk-lib.aws_lambda.IFunction`](#aws-cdk-lib.aws_lambda.IFunction)

The Lambda function created.

---


## Structs <a name="Structs"></a>

### MicroAppsAppReleaseProps <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps"></a>

Properties to initialize an instance of `MicroAppsAppRelease`.

#### Initializer <a name="[object Object].Initializer"></a>

```typescript
import { MicroAppsAppReleaseProps } from '@pwrdrvr/microapps-app-release-cdk'

const microAppsAppReleaseProps: MicroAppsAppReleaseProps = { ... }
```

##### `table`<sup>Required</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.table"></a>

- *Type:* [`aws-cdk-lib.aws_dynamodb.ITable`](#aws-cdk-lib.aws_dynamodb.ITable)

DynamoDB table for data displayed / edited in the app.

This table is used by @pwrdrvr/microapps-datalib.

---

##### `functionName`<sup>Optional</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.functionName"></a>

- *Type:* `string`
- *Default:* auto-generated

Name for the Lambda function.

While this can be random, it's much easier to make it deterministic
so it can be computed for passing to `microapps-publish`.

---

##### `nodeEnv`<sup>Optional</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.nodeEnv"></a>

- *Type:* `string`

NODE_ENV to set on Lambda.

---

##### `removalPolicy`<sup>Optional</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.removalPolicy"></a>

- *Type:* [`aws-cdk-lib.RemovalPolicy`](#aws-cdk-lib.RemovalPolicy)

Removal Policy to pass to assets (e.g. Lambda function).

---

##### ~~`sharpLayer`~~<sup>Optional</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.sharpLayer"></a>

- *Deprecated:* Ignored if passed, this is no longer needed

- *Type:* [`aws-cdk-lib.aws_lambda.ILayerVersion`](#aws-cdk-lib.aws_lambda.ILayerVersion)

`sharp` node module Lambda Layer for Next.js image adjustments.

---

##### ~~`staticAssetsS3Bucket`~~<sup>Optional</sup> <a name="@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.staticAssetsS3Bucket"></a>

- *Deprecated:* Ignored if passed, this is no longer needed

- *Type:* [`aws-cdk-lib.aws_s3.IBucket`](#aws-cdk-lib.aws_s3.IBucket)

Bucket with the static assets of the app.

---


## Protocols <a name="Protocols"></a>

### IMicroAppsAppRelease <a name="@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease"></a>

- *Implemented By:* [`@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease`](#@pwrdrvr/microapps-app-release-cdk.MicroAppsAppRelease), [`@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease`](#@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease)

Represents a Release app.


#### Properties <a name="Properties"></a>

##### `lambdaFunction`<sup>Required</sup> <a name="@pwrdrvr/microapps-app-release-cdk.IMicroAppsAppRelease.lambdaFunction"></a>

- *Type:* [`aws-cdk-lib.aws_lambda.IFunction`](#aws-cdk-lib.aws_lambda.IFunction)

The Lambda function created.

---

