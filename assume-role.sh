
#!/bin/bash

output="/tmp/assume-role-output.json"

# Next.js Demo App Role
aws sts assume-role --role-arn "arn:aws:iam::239161478713:role/AppReleaseSvcs-AppReleaseLambdaServiceRole54E94951-1RB70RIL9U5N2" --role-session-name secrets-cdk-session > $output
AccessKeyId=$(cat $output | jq -r '.Credentials''.AccessKeyId')
SecretAccessKey=$(cat $output | jq -r '.Credentials''.SecretAccessKey')
SessionToken=$(cat $output | jq -r '.Credentials''.SessionToken')

export AWS_ACCESS_KEY_ID=$AccessKeyId
export AWS_SECRET_ACCESS_KEY=$SecretAccessKey
export AWS_SESSION_TOKEN=$SessionToken
export AWS_SECURITY_TOKEN=
