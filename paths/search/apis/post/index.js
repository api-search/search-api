const vandium = require('vandium');
const mysql  = require('mysql');
const https  = require('https');
const Ajv = require("ajv");
const yaml = require('js-yaml');
const ajv = new Ajv({allErrors: true,strict: false}) // options can be passed, e.g. {allErrors: true}

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
              const apisjson = JSON.parse(Buffer.concat(data).toString());              
              contract_type = "JSON";
            } catch (error) {
              try {
                const apisjson = yaml.load(Buffer.concat(data).toString());              
                contract_type = "YAML";
              } catch (error) {}       
            }         

            // validate
            let schema = {"title":"A JSON Schema for apis.json, version 0.14","type":"object","additionalProperties":false,"patternProperties":{"^X-":{"type":"object"}},"definitions":{"maintainers":{"description":"The person or organization responsible for maintaining the API","required":["name"],"properties":{"name":{"type":"string","description":"name","minLength":5}},"additionalProperties":{"type":"string"}},"apis":{"description":"The description of the API","oneOf":[{"required":["name","description","image","baseURL","humanURL","properties","contact"],"properties":{"name":{"type":"string","description":"name","minLength":2},"description":{"type":"string","description":"description of the API","minLength":5},"image":{"type":"string","description":"URL of an image representing the API"},"baseURL":{"type":"string","pattern":"^(http)|(https)://(.*)$","description":"baseURL"},"humanURL":{"type":"string","pattern":"^(http)|(https)://(.*)$","description":"humanURL"},"tags":{"type":"array","items":{"type":"string","minLength":1},"description":"tags to describe the API"},"properties":{"type":"array","items":{"$ref":"#/definitions/urls"},"description":"URLs"},"contact":{"type":"array","items":{"$ref":"#/definitions/contact"},"description":"Contact to reach if questions about API"},"meta":{"type":"array","items":{"$ref":"#/definitions/metaInformation"}}}}]},"metaInformation":{"description":"Metadata about the API","required":["key","value"],"properties":{"key":{"type":"string"},"value":{"type":"string"}}},"contact":{"description":"Information on contacting the API support","required":["FN"],"additionalProperties":true,"patternProperties":{"^X-":{"type":"string"}},"properties":{"FN":{"type":"string","minLength":1},"email":{"type":"string"},"organizationName":{"type":"string"},"adr":{"type":"string"},"tel":{"type":"string"},"X-twitter":{"type":"string"},"X-github":{"type":"string"},"photo":{"type":"string","pattern":"^(http)|(https)://(.*)$"},"vCard":{"type":"string","pattern":"^(http)|(https)://(.*)$"},"url":{"type":"string","pattern":"^(http)|(https)://(.*)$"}}},"urls":{"description":"A representation of a URL","required":["type","url"],"properties":{"type":{"type":"string","pattern":"^(Swagger)$|^(RAML)$|^(Blueprint)$|^(WADL)$|^(WSDL)$|^(TermsOfService)$|^(InterfaceLicense)$|^(StatusPage)$|^(Pricing)$|^(Forums)$|^(AlertsTwitterHandle)$|^(X-[A-Za-z0-9\\-]*)$"},"url":{"type":"string","pattern":"^(http)|(https)://(.*)$"}}},"tags":{"description":"A consistent set of tag to apply to a description"},"include":{"description":"Include other APIs.json file","required":["name","url"],"properties":{"name":{"type":"string","minLength":1},"url":{"type":"string","pattern":"^(http)|(https)://(.*)$"}}}},"required":["name","description","url","apis","maintainers","tags"],"properties":{"name":{"type":"string","description":"The name of the service described","minLength":5},"description":{"type":"string","description":"Description of the service","minLength":5},"url":{"type":"string","description":"URL where the apis.json file will live","pattern":"^(http)|(https)://(.*)$"},"image":{"type":"string","description":"Image to represent the API"},"created":{"type":"string","description":"Date when the file was created"},"modified":{"type":"string","description":"Date when the file was modified"},"specificationVersion":{"type":"string","description":"APIs.json spec version, latest is 0.14"},"apis":{"type":"array","items":{"$ref":"#/definitions/apis"},"description":"All the APIs of this service"},"maintainers":{"type":"array","items":{"$ref":"#/definitions/contact"},"description":"Maintainers of the apis.json file"},"tags":{"type":"array","items":{"$ref":"#/definitions/tags"},"description":"Tags to describe the service"},"include":{"type":"array","items":{"$ref":"#/definitions/include"},"description":"Links to other apis.json definitions included in this service"}}};          
            
            const date = new Date();
            var created = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();             
          
            let validate = ajv.compile(schema)
            
            const valid = validate(apisjson);              

            // Valid
            if(valid){

              var api_name = apisjson.name;
              var api_slug = slugify(api_name);

              var path = '/repos/api-search/artisanal/contents/_apis/' + api_slug + '/apis.md';
              const options = {
                  hostname: 'api.github.com',
                  method: 'GET',
                  path: path,
                  headers: {
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "apis-io-search",
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
                    m.sha = sha;
                    m.content = btoa(unescape(encodeURIComponent(api_yaml)));

                    // Check from github
                    var path = '/repos/api-search/artisanal/contents/_apis/' + api_slug + '/apis.md';          
                    const options = {
                        hostname: 'api.github.com',
                        method: 'PUT',
                        path: path,
                        headers: {
                          "Accept": "application/vnd.github+json",
                          "User-Agent": "apis-io-search",
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

                        // Publish to Github  
                        response['response'] = "It has been published to Artisanal!";            
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
                response['response'] = "Sorry, not a valid APIs.json.";            
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