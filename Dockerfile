FROM node:15-slim as base

WORKDIR /app

# Download the sharp libs once to save time
# Do this before copying anything else in
RUN mkdir -p image-lambda-npms && \
  cd image-lambda-npms && npm i sharp && \
  rm -rf node_modules/sharp/vendor/*/include/

# Copy in the build output from `npx serverless`
COPY .serverless_nextjs .
COPY config.json .

# Move the sharp libs into place
RUN rm -rf image-lambda/node_modules/ && \
  mv image-lambda-npms/node_modules image-labmda/ && \
  rm -rf image-lambda-npms



FROM public.ecr.aws/lambda/nodejs:14 AS final

# Copy in the munged code
COPY --from=base /app .

CMD [ "./index.handler" ]

