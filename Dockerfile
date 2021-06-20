FROM node:15-slim as base

WORKDIR /app

# Copy in the build output from `npx serverless`
COPY .serverless_nextjs .
COPY config.json .
RUN cd image-lambda && npm i sharp
RUN cd image-lambda && npm i sharp && \
  rm -rf node_modules/sharp/vendor/*/include/



FROM public.ecr.aws/lambda/nodejs:14 AS final

# Copy in the munged code
COPY --from=base /app .

CMD [ "./index.handler" ]

