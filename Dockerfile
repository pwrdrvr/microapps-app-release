FROM node:16-slim as base

WORKDIR /app

# FROM public.ecr.aws/lambda/nodejs:16 AS final

# # Copy in the munged code
# COPY --from=base /app .

# CMD [ "./index.handler" ]

