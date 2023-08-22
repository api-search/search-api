# APIs.io Search API
This is the Search API for the APIs.io search Search. 

There are two things going on this repository.

- **AWS Lambda API** - The actual deployment of the APIs.io Search API.
- **API Documentation** - The Jekyll and Swagger UI document for the API.

The two layers are defined by a separate set of files.

## AWS Lambda API
Using GitHub and GitHub actions to deploy the API, with the following folders / files supporting:

- .github/workflows/pipeline.yml - This deploys an individual script to Lambda.
- /paths - These are all of the scripts for each individual API operation.
- action.yaml - Helps drive the build process.
- Dockerfile - Provides the container for the build process.
- package-lock.json - NPM package for building.
- package.json - NPM package for building.

Editing the pipeline and paths is how you develop on top of this API, and deploy changes to the API.

## API Documentation
Using GitHub and Jekyll for deploying a static website that hosts the documentation for this API, with the following folders / files supporting:

- _data - YAML and JSON data store for the documentation.
- _includes - Include files for the documentation.
- _layouts - The default layouts for the documentation.
- _sass - The CSS styles for the documentation.
_ assets - Images, CSS, and JavaScript for the documentation.
- 404.md - The 404 page for the documentation.
- CNAME - The DNS CNAME for the documentation.
- favicon.ico - The fav icon for the documentation.
- index.md - The home page for the documentation.
- LICENSE - The license for the documentation.
- openapi.yml - The OpenAPI for the documentation.
- README - The README for the API.
- sitemap.xml - The sitemap.xml for the documentation.

The documentation site is all automated across all of the APIs, and hand editing isn't really necessary.

The goals of this approach is to keep the APIs and their documentation modular and independently built.