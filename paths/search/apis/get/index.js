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

    var sql1 = "SELECT count(*) as api_count FROM apis a WHERE a.id IS NOT NULL";
    
    var sql_search = '';
    if(search != ''){
      sql_search = " AND (a.name LIKE '%" + search + "%'";
      //sql_search += " OR a.description LIKE '%" + search + "%'";
      sql_search += " OR a.tags LIKE '%" + search + "%')";
    }

    sql1 = sql1 + sql_search;
    
    connection.query(sql1, function (error, results1, fields) { 
      
      if(results1[0]){
          
        const api_count = results1[0].api_count;
      
        let sql2 = "select * FROM apis a WHERE a.id IS NOT NULL" + sql_search + " GROUP BY a.name LIMIT " + page + "," + limit;

        connection.query(sql2, function (error, results2, fields) {
    
          if(error){

            let response = {};
            response.sql1 = sql1;
            response.sql2 = sql2;
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
            //meta.sql1 = sql1;
            //meta.sql2 = sql2;
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
              d.name = results2[i].name;              
              d.description = results2[i].description;
              d.searchUrl = results2[i].search_node_url;
              d.apiUrl = results2[i].human_url;
              d.indexUrl = results2[i].apis_json_url;
              d.score = results2[i].score;

              if(results2[i].tags){
                d.tags = results2[i].tags.split(",");
              }
              else{
                d.tags = "";
              }
              data.push(d);
              
            }

            var sql3 = "INSERT INTO searches(search,api_count) VALUES(" + connection.escape(search) + "," + api_count + ")";

            var response = {};
            //response.sql1 = sql1;
            //response.sql2 = sql2;
            //response.sql3 = sql3;
            response.meta = meta;
            response.data = data;
            response.links = links;            

            connection.query(sql3, function (error, results1, fields) {             
            
              callback( null, response );

            });

          }  

        });

      }
      else{

        let meta = {};
        meta.search = search;
        meta.limit = 0;
        meta.page = 0;
        meta.totalPages = 0;

        var response = {};
        response.meta = meta;
        response.data = [];
        response.links = {};        
        
        callback( null, response );        
        
      }

    });
});