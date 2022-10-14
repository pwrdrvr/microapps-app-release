FROM node:16-slim as base

WORKDIR /app

# # Download the sharp libs once to save time
# # Do this before copying anything else in
# RUN mkdir -p image-lambda-npms && \
#   cd image-lambda-npms

# # Move the sharp libs into place
# RUN rm -rf image-lambda/node_modules/ && \
#   mv image-lambda-npms/node_modules image-labmda/ && \
#   rm -rf image-lambda-npms



# FROM public.ecr.aws/lambda/nodejs:16 AS final

# # Copy in the munged code
# COPY --from=base /app .

# CMD [ "./index.handler" ]

