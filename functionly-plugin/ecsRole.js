module.exports = {
  default: ({ logger }) => {
    return {
      hooks: {
        'after:IAM-Role-corp-check-rest': context => {
          return new Promise((resolve, reject) => {
            try {
              const roleResource = context.CloudFormationTemplate.Resources.IAMcorpcheckrest;
              const policies = roleResource.Properties.Policies;
              policies.push({
                PolicyName: {
                  'Fn::Join': [ '-', [ 'functionly', 'corp-check-rest', 'ecs' ] ]
                },
                PolicyDocument: {
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: [ 'ecs:RunTask' ],
                      Resource: [
                        {
                          'Fn::Sub': 'arn:aws:ecs:${AWS::Region}:${AWS::AccountId}:*'
                        }
                      ]
                    }
                  ]
                }
              });
            } catch (e) {
              logger.error(`ERROR when add ECS role: ${e.message}`);
            }
            resolve();
          });
        }
      }
    };
  }
};
