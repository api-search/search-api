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
    
    var search = '';
    if(event.search){
      search = event.search;
    }    
    
    var page = 0;
    if(event.page){
      page = event.page;
    }
    
    var limit = 50;
    if(event.limit){
      limit = event.limit;
    }   
    if(limit > 1000){
      limit = 1000;
    }

      var sql = "SELECT count(*) as api_count FROM apis a WHERE a.id IS NOT NULL";
      
      var sql_search = '';
      if(search != ''){
        sql_search = " AND (a.name LIKE '%" + search + "%'";
        sql_search += " OR a.description LIKE '%" + search + "%'";
        sql_search += " OR a.tags LIKE '%" + search + "%')";
      }

      sql = sql + sql_search;
      
      connection.query(sql, function (error, results1, fields) { 
        
        const api_count = results1[0].api_count;
        //const api_count = 0;
      
        //let sql2 = "SELECT a.name,a.description,a.image,a.baseURL,a.humanURL,a.apisjson_url,a.tags,(select score from apisjson aj WHERE aj.url = a.apisjson_url) as score,(select percentage from apisjson aj WHERE aj.url = a.apisjson_url) as percentage,GROUP_CONCAT(CONCAT(p.type,'~', p.url)) as properties FROM apis a LEFT JOIN properties p ON a.baseURL = p.api_base_url WHERE a.id IS NOT NULL" + sql_search + " GROUP BY a.name LIMIT " + page + "," + limit;
        let sql2 = "select a.name,ao.name as name2,a.slug,ao.slug as slug2,a.description,ao.description AS description2,a.image,ao.image AS image2,a.baseURL,a.humanURL,a.apisjson_url,a.tags,a.published,(select name from apisjson_overlay aj WHERE aj.apisjson_url = a.apisjson_url) as indexName,(select score from apisjson aj WHERE aj.url = a.apisjson_url) as score,(select percentage from apisjson aj WHERE aj.url = a.apisjson_url) as percentage,(select rules from apisjson aj WHERE aj.url = a.apisjson_url) as rules FROM apis a LEFT JOIN apis_overlay ao ON a.humanURL = ao.humanURL WHERE a.id IS NOT NULL" + sql_search + " GROUP BY a.name LIMIT " + page + "," + limit;

        connection.query(sql2, function (error, results2, fields) {
    
          if(error){

            let response = {};
            //response.sql = sql;
            //response.sql2 = sql2;
            response.error = error;
            
            callback( null, response );

          }
          else{

            let total_pages = api_count/limit;
            if(total_pages<1){ total_pages = 0; }
            total_pages = Math.round(total_pages);
            
            let meta = {};
            meta.search = search;
            meta.limit = limit;
            meta.page = page;
            //meta.sql = sql2;
            meta.totalPages = total_pages;
            
            let links = {};
            links.self = '/search/apis/?search=' + search + '&page=' + page + '&limit=' + limit;
            if(page!=0){
              links.first = '/search/apis/?search=' + search + '&page=-0&limit=' + limit;
              links.prev = '/search/apis/?search=' + search + '&page=' + page-1 + '&limit=' + limit;
            }
            
            if(total_pages > 1){
              links.next = '/search/apis/?search=' + search + '&page=' + page+1 + '&limit=' + limit;
            }
            links.last = '/search/apis/?search=' + search + '&page=' + total_pages + '&limit=' + limit;
      
            let data = [];
            for (let i = 0; i < results2.length; i++) {
            
              let d = {};
              d.name = results2[i].name2;
              d.slug = results2[i].slug2;
              d.score = results2[i].score;
              d.percentage = results2[i].percentage;
              d.description = results2[i].description2;
              d.image = results2[i].image;
              d.humanURL = results2[i].humanURL;
              d.baseURL = results2[i].baseURL;
              d.apisjson_url = results2[i].apisjson_url;

              if(results2[i].tags){
                d.tags = results2[i].tags.split(",");
              }
              else{
                d.tags = "";
              }
              
              let properties = [];
              if(results2[i].properties){
                let blob = results2[i].properties;
                properties = blob.split(",");
              }
              
              let return_properties = [];
              for (let j = 0; j < properties.length; j++) {
                
                let p_array = properties[j].split("~");
                
                let p = {};
                p.type = p_array[0];
                p.url = p_array[1];
                return_properties.push(p);
                
              }
              
              d.properties = return_properties;
              data.push(d);
              
            }
      
            var response = {};
            //response.sql = sql;
            //response.sql2 = sql2;
            response.meta = meta;
            response.data = data;
            response.links = links;

            var sql = "INSERT INTO searches(search) VALUES(" + connection.escape(search) + ")";
    
            connection.query(sql, function (error, results1, fields) {             
            
              callback( null, response );

            });

          }  

      });

    });
});