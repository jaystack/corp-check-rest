const AWS = require('aws-sdk');
const { join, normalize } = require('path');
const fs = require('fs');

const uploadfile = async (s3, from, to, stage, logger) => {
  const filepath = normalize(join(__dirname, from));
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, function(err, Body) {
      if (err) {
        logger && logger.info(`failed to upload ${to}`, err);
        return reject(err);
      }

      s3.putObject(
        {
          Key: to,
          Bucket: `corp-check-rest-filestorage-${stage}`,
          Body,
          ACL: 'public-read'
        },
        (err, result) => {
          if (err) {
            logger && logger.info(`failed to upload ${to}`, err);
            reject(err);
          } else {
            logger && logger.info(`uploaded ${to}`);
            resolve(result);
          }
        }
      );
    });
  });
};

module.exports = {
  default: ({ logger }) => {
    return {
      hooks: {
        'after:CreateEnvironment': async context => {
          const s3 = new AWS.S3({
            apiVersion: '2006-03-01',
            region: context.awsRegion || 'eu-central-1'
          });

          if (!context.packageOnly) {
            await uploadfile(
              s3,
              '../content/images/status/corp-check-accepted.svg',
              'images/status/corp-check-accepted.svg',
              context.stage,
              logger
            );
            await uploadfile(
              s3,
              '../content/images/status/corp-check-failed.svg',
              'images/status/corp-check-failed.svg',
              context.stage,
              logger
            );
            await uploadfile(
              s3,
              '../content/images/status/corp-check-inprogress.svg',
              'images/status/corp-check-inprogress.svg',
              context.stage,
              logger
            );
            await uploadfile(
              s3,
              '../content/images/status/corp-check-not-recommended.svg',
              'images/status/corp-check-not-recommended.svg',
              context.stage,
              logger
            );
            await uploadfile(
              s3,
              '../content/images/status/corp-check-recommended.svg',
              'images/status/corp-check-recommended.svg',
              context.stage,
              logger
            );
            await uploadfile(
              s3,
              '../content/images/status/corp-check-rejected.svg',
              'images/status/corp-check-rejected.svg',
              context.stage,
              logger
            );
          }
        }
      }
    };
  }
};
