const vandium = require('vandium');
const mysql  = require('mysql');

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

        var apisjson_url = event.url);

        https.get(apisjson_url, res => {
          
          let data = [];
          const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
          
          res.on('data', chunk => {
            data.push(chunk);
          });
        
          res.on('end', () => {
            
            console.log('Response ended: ');
            
            const apisjson = JSON.parse(Buffer.concat(data).toString());
            
            // validate
            let schema = {"title":"A JSON Schema for apis.json, version 0.14","type":"object","additionalProperties":false,"patternProperties":{"^X-":{"type":"object"}},"definitions":{"maintainers":{"description":"The person or organization responsible for maintaining the API","required":["name"],"properties":{"name":{"type":"string","description":"name","minLength":5}},"additionalProperties":{"type":"string"}},"apis":{"description":"The description of the API","oneOf":[{"required":["name","description","image","baseURL","humanURL","properties","contact"],"properties":{"name":{"type":"string","description":"name","minLength":2},"description":{"type":"string","description":"description of the API","minLength":5},"image":{"type":"string","description":"URL of an image representing the API"},"baseURL":{"type":"string","pattern":"^(http)|(https)://(.*)$","description":"baseURL"},"humanURL":{"type":"string","pattern":"^(http)|(https)://(.*)$","description":"humanURL"},"tags":{"type":"array","items":{"type":"string","minLength":1},"description":"tags to describe the API"},"properties":{"type":"array","items":{"$ref":"#/definitions/urls"},"description":"URLs"},"contact":{"type":"array","items":{"$ref":"#/definitions/contact"},"description":"Contact to reach if questions about API"},"meta":{"type":"array","items":{"$ref":"#/definitions/metaInformation"}}}}]},"metaInformation":{"description":"Metadata about the API","required":["key","value"],"properties":{"key":{"type":"string"},"value":{"type":"string"}}},"contact":{"description":"Information on contacting the API support","required":["FN"],"additionalProperties":true,"patternProperties":{"^X-":{"type":"string"}},"properties":{"FN":{"type":"string","minLength":1},"email":{"type":"string"},"organizationName":{"type":"string"},"adr":{"type":"string"},"tel":{"type":"string"},"X-twitter":{"type":"string"},"X-github":{"type":"string"},"photo":{"type":"string","pattern":"^(http)|(https)://(.*)$"},"vCard":{"type":"string","pattern":"^(http)|(https)://(.*)$"},"url":{"type":"string","pattern":"^(http)|(https)://(.*)$"}}},"urls":{"description":"A representation of a URL","required":["type","url"],"properties":{"type":{"type":"string","pattern":"^(Swagger)$|^(RAML)$|^(Blueprint)$|^(WADL)$|^(WSDL)$|^(TermsOfService)$|^(InterfaceLicense)$|^(StatusPage)$|^(Pricing)$|^(Forums)$|^(AlertsTwitterHandle)$|^(X-[A-Za-z0-9\\-]*)$"},"url":{"type":"string","pattern":"^(http)|(https)://(.*)$"}}},"tags":{"description":"A consistent set of tag to apply to a description"},"include":{"description":"Include other APIs.json file","required":["name","url"],"properties":{"name":{"type":"string","minLength":1},"url":{"type":"string","pattern":"^(http)|(https)://(.*)$"}}}},"required":["name","description","url","apis","maintainers","tags"],"properties":{"name":{"type":"string","description":"The name of the service described","minLength":5},"description":{"type":"string","description":"Description of the service","minLength":5},"url":{"type":"string","description":"URL where the apis.json file will live","pattern":"^(http)|(https)://(.*)$"},"image":{"type":"string","description":"Image to represent the API"},"created":{"type":"string","description":"Date when the file was created"},"modified":{"type":"string","description":"Date when the file was modified"},"specificationVersion":{"type":"string","description":"APIs.json spec version, latest is 0.14"},"apis":{"type":"array","items":{"$ref":"#/definitions/apis"},"description":"All the APIs of this service"},"maintainers":{"type":"array","items":{"$ref":"#/definitions/contact"},"description":"Maintainers of the apis.json file"},"tags":{"type":"array","items":{"$ref":"#/definitions/tags"},"description":"Tags to describe the service"},"include":{"type":"array","items":{"$ref":"#/definitions/include"},"description":"Links to other apis.json definitions included in this service"}}};          
            
            const date = new Date();
            var created = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();             
          
            let validate = ajv.compile(schema)
            
            const valid = validate(apisjson)

            // override validation for now
            if (!valid){
      
              const date = new Date();
              var created = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();
            
              // If valid then lets insert for processing
              var sql = "SELECT * FROM apisjson WHERE url = " + connection.escape(apisjson_url);
              connection.query(sql, function (error, results, fields) {   
                
                if(results && results.length == 0){
                  
                  var sql2 = "INSERT INTO apisjson(url,created,modified) VALUES(" + connection.escape(apisjson_url) + ",'" + created + "','" + created + "')";
                  connection.query(sql2, function (error, results, fields) {
              
                    if(results.affectedRows && results.affectedRows > 0){
                      var response = {};
                      response.sql = sql;
                      response.sql2 = sql2;
                      response['response'] = "Added for processing.";            
                      callback( null, response );
                    }
                    else{
                      var response = {};
                      response.sql = sql;
                      response.sql2 = sql2;                
                      response['response'] = "Problem adding to queue..";            
                      callback( null, response );            
                    }
              
                  });
                
                }
                else{
                  var response = {};
                  response.sql = sql;
                  response['response'] = "Already in there..";            
                  callback( null, response );              
                }
                
              });  
              
            }

            });
          }).on('error', err => {
            callback( null, err )
          });    
          
          // End Pull
          
      }  
    else{
      
      var response = {};
      response['response'] = 'It was a bad URL.';
      callback( null, response );
      
      }
    }
    else{
      
      var response = {};
      response['response'] = 'No URL was provided.';
      callback( null, response );
      
    }
});