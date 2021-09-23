const express = require('express');
const handlebars = require('express-handlebars');
const productos = require('./productos.js');
const { SocketAddress } = require('net');

class Funciones {
    getSiguienteId = ( productos ) => {
      let ultimoId = 0
      productos.forEach(producto => {
        if (producto.id > ultimoId){
          ultimoId = producto.id
        }
      });
      return ++ultimoId
    }
}
const funciones = new Funciones()

const app = express();
const PORT = 8080;
const router = express.Router();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/api', router);

app.use(express.static('public'));

const server = http.listen(PORT,
  () => console.log('escuchando...'));
server.on('error', error=>console.log('Error en servidor', error));

router.get('/', (req,res)=>{
  const objRes = 
  {msg: "Sitio principal de productos"};
  res.json(objRes);
});

router.get("/productos/listar", (req, res) => {
    if (productos.length == 0) {
        return res.status(404).json({ error: "no hay productos cargados" });
      }
    res.json(productos);
  });
  
router.get("/productos/listar/:id", (req, res) => {
    const { id } = req.params;
    const producto = productos.find((producto) => producto.id == id);
    if (!producto) {
        return res.status(404).json({ error: "producto no encontrado" });
      }
    res.json(producto);
});
  
router.put("/productos/actualizar/:id", (req, res) => {
  const { id } = req.params;
  let { title, price, thumbnail } = req.body;
  let producto = productos.find((producto) => producto.id == id);
  if (!producto) {
    return res.status(404).json({ msg: "Usuario no encontrado" });
  }
  (producto.title = title), (producto.price = price), (producto.thumbnail = thumbnail);

  res.status(200).json(producto);
});

router.delete("/productos/borrar/:id", (req, res) => {
  const { id } = req.params;
  const producto = productos.find((producto) => producto.id == id);

  if (!producto) {
    return res.status(404).json({ msg: "Usuario no encontrado" });
  }

  const index = productos.findIndex((producto) => producto.id == id);
  productos.splice(index, 1);

  res.status(200).end();
});

app.engine(
    "hbs",
    handlebars({
        extname: ".hbs",
        defaultLayout: "index.hbs",
        layoutsDir: __dirname + "/views/layouts",
        partialsDir: __dirname + "/views/partials"
    })
);

app.set('views', './views'); // especifica el directorio de vistas
app.set('view engine', 'hbs'); // registra el motor de plantillas

app.get('/productos/vista', function(req, res) {
  console.log(productos)
  let tieneDatos;
  if(productos.length > 0){
    tieneDatos = true
  }else{
    tieneDatos = false
  }
  res.render('main', { productos: productos, listExists: tieneDatos });
});

io.on('connection', (socket) => {
    console.log('alguien se está conectado...');
    
    io.sockets.emit('listar', productos);
    
    socket.on('notificacion', (titulo, precio, imagen) => {
        const producto = {
          id: funciones.getSiguienteId(productos),
          titulo: titulo,
          precio: precio,
          thumbnail: imagen,
        };
        productos.push(producto);

        io.sockets.emit('listar', productos);
    })

});
