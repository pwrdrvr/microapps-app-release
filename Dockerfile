FROM node:15-slim as base

WORKDIR /app

# Copy in the build output from `npx serverless`
COPY .serverless_nextjs .
COPY config.json .
RUN cd image-lambda && npm i sharp

# TODO: Copy in the router code that binds the 3 lambdas together

FROM public.ecr.aws/lambda/nodejs:12 AS final

# Copy in the munged code
COPY --from=base /app .

CMD [ "./index.handler" ]

