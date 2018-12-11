'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
//Me conecto a mi MongoDB a través de Mongoose
mongoose.connect(process.env.MONGO_URI);


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// Test API EndPoint
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

//---------------------------------------------------------------------------
//FUNCIONALIDAD PRINCIPAL DEL PROGRAMA
//---------------------------------------------------------------------------
console.log("Que comience el programa");
//Creo mi modelo de base de datos
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var urlSchema = new Schema({ 
  number: {type: String, required: true},
  url: {type: String, required: true}
});

var URL = mongoose.model('URL', urlSchema);

//Necesito un Body-Parser para poder leer métodos POST
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}));

//Añado DNS para comprobar que la pagina web efectivamente existe
const dns = require('dns');

//Variable pra ir asignando números a las URLs
var incremental = 0;


app.post("/api/shorturl/new",(req, res) => {
  var urlGlobal = req.body.url;
  var urlPlana = urlGlobal.replace(/(^\w+:|^)\/\//, ""); //https://www.freecodecamp.com -> www.freecodecamp.com
  
  dns.lookup(urlPlana, (err, address, family) =>{
    if(err){
      console.log(err)
      res.json({error: "invalid URL"})
    }
    else{
      console.log("URL Correcta, procedemos a insertarla en la BBDD");
      //Busco en la BD el dato. Si está lo devuelvo. Si no está, lo creo y lo devuelvo
      URL.findOne({ url:  urlGlobal}, (req,response)=>{ //Busco algo que coincida con url, de eso me quedo los 3 parametros y saco función de error
        //----------------- IF TERNARIO --------------
        if(response!==null){
          res.json({url: response.url, URLnumbertuampa: response.number})
        }
        else{
          URL.create({url:  urlGlobal, number: incremental}, (err,data)=>{
            if(err){console.log(err);}
            else{
              URL.findOne({url:  urlGlobal},("number url"), (req, response) =>{
                incremental++;
                console.log("Insertada una nueva entrada: "+incremental);
                res.json({url: response.url, URLnumber: response.number})
              });
            }
          });
        }
      });   
    }
  });
});

//Si alguien escribe .../api/shorturl/X, tengo que redirigirlo a la web que haya puesto
app.get("/api/shorturl/:data", function (req, res) {
  URL.findOne({number : req.params.data}, function(err,data){
    //----------------- IF TERNARIO --------------
    err ? console.log(err)
      : data!==null ? res.redirect(data.url)
        : res.json({"error":"link not found"});
    //---------------------------------------------
  });  
});
//---------------------------------------------------------------------------

app.listen(port, function () {
  console.log('Node.js listening ...');
});