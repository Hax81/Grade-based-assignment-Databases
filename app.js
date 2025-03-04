//I denna fil lägger jag det som har med servern att göra

const express = require ('express'); //Använd express
const {getAllProducts, getProductById, getProductsBySearchTerm, getProductsByCategoryId, createNewProduct, updateProductById, deleteProductById, getCustomerInfoById, updateCustomerInfoById, listAllOrdersOfSpecificCustomer, statsPerCategory, averagePoints} = require('./index.js');
const app = express(); //deklarera konstanten app som express

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(8000, () => { //Sätt upp server. Port 8000 avlyssnas.

  console.log("Server is running"); //Kontrollera att servern fungerar genom console.log. 

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Produkthantering
//Uppgift 1: GET /products
app.get('/products', (req,res) => { 

try {
  const chooseSortingOfPrice = req.query.sort || 'ASC'; //req.query är objektet som har queryparametrarna i URL. req.query.sort pekar på "sort" queryparametern.
  const products = getAllProducts(chooseSortingOfPrice || 'ASC'); //Anropa functionen med chooseSortingOfPrice som parameter, tilldela sedan till products.
  console.log('Products:', products); //Kolla products-variabeln i konsollen
  if (products && products.length > 0) { //Arrayen products får inte vara tom. Om den är tom = produkter kan ej hittas = 404 
    res.status(200).json(products);
  } else {
    console.error('Error when trying to get the products because no products could be found');
    res.status(404).json({Error: 'Failed to fetch products because no products could be found'}); //json-objekt med key-value.
  }

} catch (err) {
console.error('Server error when trying to get the products', err);
res.status(500).json({Error: 'There was a server error when trying to get the products'});
}

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 2: GET /products/:id
app.get('/products/:id', (req,res) => { //Kolontecknet säkerställer dynamik

  const productId = req.params.id; //Ta id-parametern från request-url. Tilldela den till variabeln (av const-typ) productId
  const product = getProductById(productId);

  if (product) {
    res.json(product);
} else {
    res.status(404).json({Error: 'The product with this id can not be found'}); //404 not found
}
});                         

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 3: GET /products/search?name={searchterm}


//app.get(`/products/search`, (req,res) => { //OBS! DETTA FUNGERAR INTE! VARFÖR? ROUTE CONFLICT? Måste ha endast app.get(`/search)!
app.get(`/search`, (req,res) => { 
const searchterm = req.query.name; 

if(!searchterm) {
  return res.status(400).json({Error: 'You must enter a searchterm'}); //400 bad request
}

const products = getProductsBySearchTerm(searchterm);
res.json(products);

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 4: GET/products/category/:categoryId 
app.get('/categories/:categoryId', (req,res) => { 
const categoryId = req.params.categoryId;

if(!categoryId) {
  return res.status(400).json({Error: 'You must enter a category'}); //400 bad request
}
const result = getProductsByCategoryId(categoryId);
res.json(result);

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 5: /POST /products
app.use(express.json());

app.post('/newproduct', (req,res) => {
  try {
  let {manufacturer_id, name, description, price, stock_quantity} = req.body; //request body med rådatainfon

  if(!manufacturer_id || !name || !description || !price || !stock_quantity) { //Om något av fälten ej är ifyllda så returnera meddelandet
    return res.status(400).json({error: 'All fields in Product must be filled'}); //400 bad request
  }

  let newProduct = { //Objektet newProduct skapas med key-value paren för produkten som ska läggas till, ges till createNewProduct
    manufacturer_id, 
    name,
    description,
    price,
    stock_quantity
  };

  const resultOfCreatingProduct = createNewProduct(newProduct);

  if(resultOfCreatingProduct) {
  res.status(201).json({message: 'Product could be created'}); //201: created

  }else{
  res.status(400).json({error: 'Error. Product could NOT be created'}); //400 bad request om användaren skriver in felaktig parameter
  }

} catch (err) {
  console.error('There was a server error. Product not created', err);
  res.status(500).json({Error:'There was a server error when trying to create the product!'});
}

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 6: PUT /products/:id
app.use(express.json());

app.put('/products/:id', (req,res) => {
const product_id = req.params.id; // Hämta product_id från request parameters (request url) Om t.ex /products/400 så är product_id 400. 

const {manufacturer_id, name, description, price, stock_quantity} = req.body; //Hämta manufacturer_id o de andra från req.body

if(!manufacturer_id || !name || !description || !price || !stock_quantity) { //Om något av fälten ej är ifyllda så returnera meddelandet
  return res.status(400).json({error: 'All fields in Product must be filled'}); //Json-objekt med key-value. Key är "error" och value är textsträngen)
}

try {
const  updatedProductData = { //skapa nytt objekt (för att uppdatera product) som...
  product_id, //inkluderar product_id från req.params
  manufacturer_id, //inkluderar övriga från req.body
  name,
  description,
  price,
  stock_quantity
}

const resultOfUpdatingProduct = updateProductById(updatedProductData); //Funktionen anropas med updatedProductData som argument

  if (resultOfUpdatingProduct){ //Om lyckas
  res.status(201).json({Woho: 'Product could be updated'}); // returnerar ett json-objekt med key-value par. Key är Woho och 'Product could be updated' är value. Indikerar att operationen lyckades.

  } else {
    res.status(400).json({Yikes: 'Product could NOT be updated'}); //Denna kan nog tas bort. Redundant med catch?
  }
} catch (err) {
  console.error('Error!', err);
  res.status(500).json({Oops: "There was a server error when trying to update the product"}); 

}

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 7: DELETE /products/:id

app.use(express.json());

app.delete('/products/:id', (req,res) => {
  try {
  const product_id = req.params.id; //id ska anges, lagras i variabeln product_id
  const resultOfDeletingProduct = deleteProductById(product_id); 
  const productWasDeleted = resultOfDeletingProduct.changes > 0; //Om ändringar skett (är större än 0)

    if (productWasDeleted) {
      res.status(200).json({Woho: 'Products and reviews connected to the product were deleted'}); //200 ok


    } else {
      console.error('Error!')
      res.status(404).json({Yikes: 'Productid could not be found'}); //404 not found
    }

  } catch (err) {
    console.error('Error!', err);
    res.status(500).json({Oops: 'There was a server error when trying to delete the product'}); //500 server error
  }

});



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Kundhantering
//Uppgift 1: GET /customers/:id

app.get('/customers/:id', (req,res) => {
  try {
  const customerid = req.params.id;
  const customer = getCustomerInfoById(customerid) //Anropa funktionen med customerid som argument, tilldela till customer



  if (customer) {
    res.status(200).json({Success: true, Data: customer, Marvellous: `The customer with id ${customerid} was found and displayed above with all orders that have been placed`}); //Provar olika sätt att tydliggöra positivt resultat. Använder "Marvellous" som key för att göra det lite roligt.
    
  } else {
    console.error('Error!');
    res.status(404).json({ error: 'Customer could not be found'});
  }
  


  } catch (err) {
    console.error('Error!', err);
    res.status(500).json({Error: 'There was a server error trying to get the customer information', err}); //Provar en mer professionell ton i felmeddelandet (Key är "Error" istället för "Oops" el liknande)
  }

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 2: PUT /customers/:id
app.use(express.json());
app.put('/customers/:id', (req,res) => {
  
    const customerId = req.params.id;
    const {email, phone, address} = req.body;

    if(!email || !phone || !address) { //Alla fält måste vara ifyllda
      return res.status(400).json({error: 'The following fields: customer_id, email, phone and adress must all be filled'}); //Json-objekt med key-value. Key är "error" och value är textsträngen)
    }//400 är "bad request"=rätt här. 404 är "not found". 

  try {
    const updatedCustomerData = { //skapa nytt objekt (för att uppdatera customer) som...
      customerId, //inkluderar customerId från req.params
      email, //inkluderar övriga från req.body
      phone,
      address
    };
    
    const resultOfUpdatingCustomer = updateCustomerInfoById(updatedCustomerData);
    
    if (resultOfUpdatingCustomer) { 
      res.status(201).json({Message: 'Customer could be updated'}); //Mer seriös ton än "woho" etc.
    } else {
      console.error('Error when updating customer');
      res.status(404).json({Error: 'Customer could not be updated'});
    }

  } catch (err) {
    console.error('Error!', err);
    res.status(500).json({Error: 'There was a server error when trying to update the customer info', err});
  }

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 3: GET /customers/:id/orders
app.get('/customers/:id/orders', (req,res) => {
  try {
    const customerid = req.params.id;
    const resultOfGettingOrders = listAllOrdersOfSpecificCustomer(customerid);

      if (resultOfGettingOrders) {
        res.status(200).json(resultOfGettingOrders);


      } else {
        console.error('Error when trying to display the customer order because it could not be found');
        res.status(404).json({Error: `Orders for this specific customer with id ${customerid} could not be found`}); //Hittar ej id

      }


  } catch (err) {
    console.error('Error!', err);
    res.status(500).json({Error: 'There was a server error when trying to get the orders', err}); //Serverfel
  }

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Analysdata
//Uppgift 1: GET /products/stats

app.get('/stats', (req,res) => { //app.get('products/stats') fungerar inte. Problemet löste sig med ('/stats'). Route conflict pga tidigare liknande route /products/:id? (Blir det så att "stats" tolkas som "id"??)
  try {
    const productsAndPrice = statsPerCategory();
      if(productsAndPrice) {
        res.status(200).json(productsAndPrice);

      } else {
        console.error('Error when trying to display category statistics because it could not be found');
        res.status(404).json({Error: 'The category statistics could not be found'});
      }



  } catch (err) {
    console.error('Error!', err);
    res.status(500).json({Error: 'There was a server error when trying to get the category statistics'});
  }

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 2: GET /reviews/stats

app.get('/reviews/stats', (req,res) => {
  try {
    const reviewData = averagePoints();
      if(reviewData) {
        res.status(200).json(reviewData);

      } else {
        console.error('Error when trying to display the reviewdata because it could not be found'); //Kollar om averagePoints() returnerar data, om inte så loggas errormeddelandet.
        res.status(404).json({Error: 'The reviewdata could not be found'});
      }



  } catch (err) {
    console.error('Error!', err); //Hanterar serverfel när requesten görs
    res.status(500).json({Error: 'There was a server error when trying to get the review statistics'});
  }

});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////