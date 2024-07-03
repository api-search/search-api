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

    sql_search += " ORDER BY score DESC, name ASC";
    sql = sql + sql_search;
    
    connection.query(sql, function (error, results, fields) { 
  
      if(error){

        let response = {};
        response.sql = sql;
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
        meta.sql = sql;
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
        for (let i = 0; i < results.length; i++) {
        
          let d = {};
          d.name = results[i].name;
          d.score = results[i].score;
          d.description = results[i].description;
          if(results[i].tags){
            d.tags = results[i].tags.split(",");
          }
          else{
            d.tags = "";
          }

          data.push(d);
          
        }

        var sql = "INSERT INTO searches(search,api_count) VALUES(" + connection.escape(search) + "," + api_count + ")";

        var response = {};
        response.sql = sql;
        response.meta = meta;
        response.data = data;
        response.links = links;            

        connection.query(sql, function (error, results, fields) {             
        
          callback( null, response );

        });

      }  

    });
});