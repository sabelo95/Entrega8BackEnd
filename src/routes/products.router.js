import express from "express";
/* import  ProductManager from '../dao/productsManager.js'; */
import { ProductModel } from "../dao/models/products.model.js";
import { ManagerProduct } from "../dao/productsManagerMDB.js";
import { usuariosModelo } from "../dao/models/usuarios.modelo.js";
import { CartModel } from "../dao/models/carts.model.js";
import { CartManager } from "../dao/cartsManagerMDB.js";

 const cartManager = new CartManager()

const router = express.Router();
/* const productManager = new ProductManager('./src/products.json'); */
const productManager = new ManagerProduct();

const auth=(req, res, next)=>{
  if(!req.session.usuario){
      res.redirect('/login')
      return 
  }

  next()
}

router.get("/products", auth, async (req, res) => {
  try {
      
      let userCar= req.user._id
      const newCart = await cartManager.createCart(userCar);
      console.log('carrito nuevo' + newCart);

      // Añadir carrito a usuario en sesión
      /* let updateUsuario = await usuariosModelo.findOne({ email: req.session.usuario.email }); */
      

      /* updateUsuario.car = newCart._id;
      await updateUsuario.save();

      let usuario = req.session.usuario;
      let rol = req.session.usuario.rol;
      let auto = false; */

      let updateUsuario = await usuariosModelo.findOne({ email: req.session.usuario.email });

  updateUsuario.car = newCart._id;
  await updateUsuario.save();

  // Now that the save operation is completed, you can fetch the updated values
  updateUsuario = await usuariosModelo.findOne({ email: req.session.usuario.email }).lean();

  let usuario = updateUsuario;  // Assuming you want to assign the entire updated user object
  let rol = updateUsuario.rol;
  let auto = false;  // You may set the value as needed

      console.log('usuario en sesion es' + updateUsuario);

      let pagina = 1;
      if (req.query.pagina) {
          pagina = req.query.pagina;
      }

      let limite = null;
      if (req.query.limit) {
          limite = req.query.limit;
      }

      let resultado;
      let preresultado = await productManager.listarUsuarios(pagina, limite);
      let categoria = req.query.categoria ? req.query.categoria.toLowerCase() : null;

      if (req.query.categoria) {
          console.log("entrando a categoria");
          preresultado = await productManager.listarUsuarios(pagina, limite, undefined, categoria);
      }

      if (req.query.sort) {
          console.log("entrando al sort");
          let sortOrder = req.query.sort === "desc" ? -1 : 1;
          preresultado = await productManager.listarUsuarios(pagina, limite, sortOrder, categoria);
      }

      resultado = preresultado.docs;

      let { totalPages, hasNextPage, hasPrevPage, prevPage, nextPage } = preresultado;

      

      if (rol === 'admin') {
          auto = true;
      }

      res.status(200).render("products", {
          resultado: resultado,
          totalPages,
          hasNextPage,
          hasPrevPage,
          prevPage,
          nextPage,
          usuario,
          auto
      });
  } catch (error) {
      // Manejar errores aquí
      console.error(error);
      res.status(500).send("Error interno del servidor");
  }
});


router.get("/products/:pid", auth, async (req, res) => {
  let id = req.params.pid;
  let idprod = parseInt(id);

  if (isNaN(idprod)) {
    return res.send("Error, ingrese un argumento id numerico");
  }

 

  let resultado = await productManager.listarUsuariosId(idprod);

  res.status(200).render("products", {
    resultado,
  });
});

router.post("/products", async (req, res) => {
  const { title, description, code, price, stock, category, thumbnail } =
    req.body;

  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

 
  try {
    const savedProduct = await productManager.addProduct(req.body);
    res
      .status(201)
      .json({ message: "Producto agregado con éxito", producto: savedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar el producto" });
  }
});

router.post("/products/:pid", async (req, res) => {
  let id = req.params.pid;
  let idprod = parseInt(id);

  if (isNaN(idprod)) {
    return res
      .status(400)
      .json({ error: "Error, ingrese un argumento id numérico" });
  }

  const {
    title,
    description,
    code,
    price,
    stock,
    category,
    estado,
    thumbnail,
  } = req.body;

  if (
    !title ||
    !description ||
    !code ||
    !price ||
    !stock ||
    !category ||
    estado === undefined
  ) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }
 

  try {
    // Crea un objeto con los campos que deseas actualizar
    const updateFields = {
      title,
      description,
      code,
      price,
      stock,
      category,
      estado,
      thumbnail,
    };

    // Utiliza el método updateProductById del manager para actualizar el producto por ID
    const success = await productManager.updateProductById(
      idprod,
      updateFields
    );

    if (success) {
      res.status(200).json({ message: "Producto actualizado con éxito" });
    } else {
      res.status(404).json({ error: "Producto no encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
});

router.delete("/delete/:pid", async (req, res) => {
  let id = req.params.pid;
  let idprod = parseInt(id);

  if (isNaN(idprod)) {
    return res
      .status(400)
      .json({ error: "Error, ingrese un argumento id numérico" });
  }

 

  try {
    // Utiliza el método deleteProductById del manager para eliminar el producto por ID
    const success = await productManager.deleteProductById(idprod);

    if (success) {
      res.status(200).json({ message: "Producto eliminado con éxito" });
    } else {
      res.status(404).json({ error: "Producto no encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
});

export default router;
