const vandium = require('vandium');
const mysql  = require('mysql');
const https  = require('https');
const Ajv = require('ajv/dist/2020');
const yaml = require('js-yaml');
const ajv = new Ajv({allErrors: true,strict: false})

function slugify(str) {
  return String(str)
      .normalize('NFKD') // split accented characters into their base characters and diacritical marks
      .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
      .trim() // trim leading or trailing whitespace
      .toLowerCase() // convert to lowercase
      .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // remove consecutive hyphens
  }  

exports.handler = vandium.generic()
  .handler( (event, context, callback) => {

    var connection = mysql.createConnection({
    host     : process.env.host,
    user     : process.env.user,
    password : process.env.password,
    database : process.env.database
    });

    if(event.url && event.url != ''){
      
      // Valid URL
      var httpRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
      
      if(httpRegex.test(event.url)){ 

        var apisjson_url = event.url;

        https.get(apisjson_url, res => {
          
          let data = [];
          const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
          
          res.on('data', chunk => {
            data.push(chunk);
          });
        
          res.on('end', () => {
            
            console.log('Response ended: ');
            
            var contract_type = "";
            try {
              var apisjson = JSON.parse(Buffer.concat(data).toString());              
              contract_type = "JSON";
            } catch (error) {
              try {
                var apisjson = yaml.load(Buffer.concat(data).toString());              
                contract_type = "YAML";
              } catch (error) {
                var apisjson = {};
              }       
            }   
            
            //console.log("APIS.JSON: " + JSON.stringify(apisjson));

            // validate
            let schema = {"$id":"https://github.com/apis-json/api-json/blob/develop/spec/","$schema":"https://json-schema.org/draft/2020-12/schema","title":"JSON Schema for APIs.json 0.18","type":"object","additionalProperties":false,"patternProperties":{"^X-":{"type":"object"}},"$defs":{"maintainers":{"description":"The person or organization responsible for maintaining the API","required":["name"],"properties":{"name":{"type":"string","description":"name","minLength":5}},"additionalProperties":{"type":"string"}},"apis":{"description":"The description of the API","required":["name","description","image","baseURL","humanURL","properties"],"properties":{"aid":{"type":"string","description":"unique identifier for API"},"name":{"type":"string","description":"name","minLength":2},"description":{"type":"string","description":"description of the API","minLength":5},"image":{"type":"string","description":"URL of an image representing the API"},"baseURL":{"type":"string","pattern":"^(http)|(https)://(.*)$","description":"baseURL"},"humanURL":{"type":"string","pattern":"^(http)|(https)://(.*)$","description":"humanURL"},"tags":{"type":"array","items":{"type":"string","minLength":1},"description":"tags to describe the API"},"properties":{"type":"array","items":{"$ref":"#/$defs/urls"},"description":"URLs"},"contact":{"type":"array","items":{"$ref":"#/$defs/contact"},"description":"Contact to reach if questions about API"},"meta":{"type":"array","items":{"$ref":"#/$defs/metaInformation"}}}},"metaInformation":{"description":"Metadata about the API","required":["key","value"],"properties":{"key":{"type":"string"},"value":{"type":"string"}}},"contact":{"description":"Information on contacting the API support","required":["FN"],"additionalProperties":true,"patternProperties":{"^X-":{"type":"string"}},"properties":{"FN":{"type":"string","minLength":1},"email":{"type":"string","format":"email"},"organizationName":{"type":"string","minLength":1},"adr":{"type":"string"},"tel":{"type":"string","minLength":1},"X-twitter":{"type":"string"},"X-github":{"type":"string"},"photo":{"type":"string","pattern":"^(http)|(https)://(.*)$"},"vCard":{"type":"string","pattern":"^(http)|(https)://(.*)$"},"url":{"type":"string","pattern":"^(http)|(https)://(.*)$"}}},"urls":{"description":"A representation of a URL","required":["type","url"],"properties":{"name":{"type":"string","description":"The display name of the property."},"type":{"type":"string","description":"One of the designated API property types or a custom one prefixed with x-.","pattern":"^(Swagger)$|^(OpenAPI)$|^(JSONSchema)$|^(GraphQLSchema)$|^(PostmanCollection)$|^(PostmanWorkspace)$|^(AsyncAPI)$|^(RAML)$|^(Blueprint)$|^(WADL)$|^(WSDL)$|^(GettingStarted)$|^(Documentation)$|^(Authentication)$|^(Versioning)$|^(Signup)$|^(Login)$|^(TermsOfService)$|^(InterfaceLicense)$|^(PrivacyPolicy)$|^(DeprecationPolicy)$|^(ServiceLevelAgreement)$|^(Security)$|^(SDKs)$|^(StatusPage)$|^(Pricing)$|^(RateLimits)$|^(Blog)$|^(BlogFeed)$|^(Forums)$|^(Support)$|^(ChangeLog)$|^(RoadMap)$|^(Contact)$|^(ErrorCodes)$|^(GitHubOrg)$|^(GitHubRepo)$|^(Twitter)$|^(AlertsTwitterHandle)$|^(Webhooks)$|^(Integrations)$|^(OpenAIPluginManifest)$|^(X-[A-Za-z0-9\\-]*)$"},"mediaType":{"type":"string","description":"IANA media type representing the property."},"url":{"type":"string","description":"The URL for the property. * must be url or data."},"data":{"type":"object","description":"The data for the property. * must be url or data"}}},"tags":{"description":"A consistent set of tag to apply to a description"},"include":{"description":"Include other APIs.json file","required":["name","url"],"properties":{"name":{"type":"string","minLength":1},"url":{"type":"string"}}},"overlay":{"description":"Overlay other APIs.json file","required":["url"],"properties":{"name":{"type":"string","minLength":1},"url":{"type":"string"}}},"network":{"description":"Network APIs.json file","required":["name","url"],"properties":{"name":{"type":"string","minLength":1},"url":{"type":"string"}}}},"required":["name","description","url","apis","maintainers","tags"],"properties":{"aid":{"type":"string","description":"unique identifier for APIs.json"},"type":{"type":"string","description":"The type of the APIs.json collection.","enum":["Index","Template","Example"]},"name":{"type":"string","description":"The name of the service described","minLength":3,"maxLength":50},"description":{"type":"string","description":"Description of the service","minLength":5,"maxLength":1000},"url":{"type":"string","description":"URL where the apis.json file will live","pattern":"^(http)|(https)://(.*)$"},"image":{"type":"string","description":"Image to represent the API"},"created":{"type":"string","format":"date","description":"Date when the file was created"},"modified":{"type":"string","format":"date","description":"Date when the file was modified"},"specificationVersion":{"type":"string","description":"APIs.json spec version, latest is 0.18"},"apis":{"type":"array","items":{"$ref":"#/$defs/apis"},"description":"All the APIs of this service"},"maintainers":{"type":"array","items":{"$ref":"#/$defs/contact"},"description":"Maintainers of the apis.json file"},"tags":{"type":"array","items":{"$ref":"#/$defs/tags"},"description":"Tags to describe the service"},"include":{"type":"array","items":{"$ref":"#/$defs/include"},"description":"Links to other apis.json definitions included in this service"},"common":{"description":"Common properties that apply across all APIs.","type":"array","items":{"$ref":"#/$defs/urls"}},"overlays":{"type":"array","items":{"$ref":"#/$defs/overlay"},"description":"Links to other apis.json that will be overlaid original."},"network":{"type":"array","items":{"$ref":"#/$defs/network"},"description":"Links to other apis.json that will be included in discovery."}}};
            
            const date = new Date();
            var created = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();             
          
            let validate = ajv.compile(schema)
            
            const valid = validate(apisjson);              

            // Valid
            if(valid){

              var api_name = apisjson.name;
              var api_slug = slugify(api_name);

              apisjson.created = created;
              apisjson.modified = created;
              
              var path = '/repos/apis-json/artisanal/contents/_apis/' + api_slug + '/apis.md';
              const options = {
                  hostname: 'api.github.com',
                  method: 'GET',
                  path: path,
                  headers: {
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "apis-io-search",
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Authorization": 'Bearer ' + process.env.gtoken
                }
              };

              https.get(options, (res) => {

                  var body = '';
                  res.on('data', (chunk) => {
                      body += chunk;
                  });

                  res.on('end', () => {

                    var github_results = JSON.parse(body);

                    var sha = '';
                    if(github_results.sha){
                      sha = github_results.sha;
                    }

                    var api_yaml = '---\r\n' + yaml.dump(apisjson) + '---';

                    var c = {};
                    c.name = "Kin Lane";
                    c.email = "kinlane@gmail.com";

                    var m = {};
                    m.message = 'Publishing APIs.json';
                    m.committer = c;
                    if(sha!=''){
                      m.sha = sha;
                    }
                    m.content = btoa(api_yaml);

                    // Check from github
                    var path = '/repos/apis-json/artisanal/contents/_apis/' + api_slug + '/apis.md';          
                    const options = {
                        hostname: 'api.github.com',
                        method: 'PUT',
                        path: path,
                        headers: {
                          "Accept": "application/vnd.github+json",
                          "User-Agent": "apis-io-search",
                          "X-GitHub-Api-Version": "2022-11-28",
                          "Authorization": 'Bearer ' + process.env.gtoken
                      }
                    };

                    //console.log(options);

                    var req = https.request(options, (res) => {

                        let body = '';
                        res.on('data', (chunk) => {
                            body += chunk;
                        });
            
                        res.on('end', () => {

                          // Success - Issue
                          var m = {};
                          m.title = api_name;
                          m.body = 'This is an issue submitted when ' + api_name + ' was added to the APIs.io search submission form or via the API, and can be used to engage with the platform and community around the listing in the index.';
                          m.assignees = ['kinlane'];
                          m.labels = ['new'];

                          // Check from github
                          var path = '/repos/apis-json/artisanal/issues';          
                          const options_issues = {
                              hostname: 'api.github.com',
                              method: 'POST',
                              path: path,
                              headers: {
                                "Accept": "application/vnd.github+json",
                                "User-Agent": "apis-io-search",
                                "X-GitHub-Api-Version": "2022-11-28",
                                "Authorization": 'Bearer ' + process.env.gtoken
                            }
                          };
      
                          //console.log(options_issues);
      
                          var req = https.request(options_issues, (res) => {
      
                              let body_issues = '';
                              res.on('data', (chunk) => {
                                body_issues += chunk;
                              });
                  
                              res.on('end', () => {

                              var issue = JSON.parse(body_issues);
      
                              // Publish to Github  
                              var response = {};
                              response['response'] = "The API has been added to the APIs.io index.";            
                              response['url'] = 'https://github.com/apis-json/artisanal/tree/main/_apis/' + api_slug + '/apis.md?plain=1'; 
                              response['issue'] = 'https://github.com/apis-json/artisanal/issues/' + issue.number;                      
                              //response['body'] = body_issues;
                              //response['options'] = options_issues;
                              //response['issue'] = issue;
                              callback( null, response );                          
      
                              });
      
                              res.on('error', () => {
      
                                var response = {};
                                response['pulling'] = "Error writing to GitHub.";            
                                callback( null, response );  
                                connection.end();
      
                              });
      
                          });
        
                          req.write(JSON.stringify(m));
                          req.end();                           

                        // Success - Issue                                                 

                        });

                        res.on('error', () => {

                          var response = {};
                          response['pulling'] = "Error writing to GitHub.";            
                          callback( null, response );  
                          connection.end();

                        });

                    });

                  req.write(JSON.stringify(m));
                  req.end();   

                  });              

                  res.on('error', () => {

                    var response = {};
                    response['pulling'] = "Error reading from GitHub.";            
                    callback( null, response );  
                    connection.end();
                  });

                });                                
                
              }
              else{
                var response = {};
                response['response'] = valid;            
                callback( null, response );                   
              }            

            });
          }).on('error', err => {
            callback( null, err )
          });    
          
          // End Pull
          
      }  
    else{
      
      var response = {};
      response['response'] = 'Sorry, it was a bad url.';
      callback( null, response );
      
      }
    }
    else{
      
      var response = {};
      response['response'] = 'Sorry, no valid URL provided.';
      callback( null, response );
      
    }
});