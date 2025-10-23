//I denna fil lägger jag det som har med databasen att göra

const Database = require ('better-sqlite3'); //Använd better-sqlite3
const db = new Database('TechGearWebShop.db', {verbose:console.log}); //Deklarera konstanten db som databasen ifråga. Mode för loggning i konsollen ska vara "verbose", dvs mer detaljerad än standard.
module.exports = {getAllProducts, getProductById, getProductsBySearchTerm, getProductsByCategoryId, createNewProduct, updateProductById, deleteProductById, getCustomerInfoById, updateCustomerInfoById, listAllOrdersOfSpecificCustomer, statsPerCategory, averagePoints}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Produkthantering
//Uppgift 1: GET /products
// ○ Lista alla produkter
// ○ Använd JOIN för att inkludera kategori- och tillverkarinfo för varje produkt


function getAllProducts(chooseSortingOfPrice = 'ASC') { //Funktion för att hämta alla produkter ur databasen. Tar en parameter att sortering på pris är ASC (ASC är default).
  let products=[]; //Array för datan (produkterna här) som hämtas från db

try {                                                       
  const stmt = db.prepare (`
    SELECT 
    products.name AS Products, 
    categories.name AS Category, 
    manufacturers.name AS Manufacturer,
    products.price AS product_price 
    FROM products 
    LEFT JOIN products_categories ON products.product_id=products_categories.product_id 
    LEFT JOIN manufacturers ON products.manufacturer_id =manufacturers.manufacturer_id 
    LEFT JOIN categories ON products_categories.category_id=categories.category_id
    ORDER BY products.price ${chooseSortingOfPrice === 'DESC' ? 'DESC' : 'ASC'}
    `);
//Queryparameter ORDER BY för sortering på pris i products-kolumnen, default stigande (ASC) (VG-kravet). 
  products = stmt.all(); //utför sql-statement och lagra datan i products-variabeln (som är en array)

  } catch (err) {
   console.error ("An error occured when fetching products:", err);
  }
  
    products.forEach(product => { //Loop för att skriva ut alla produkter med tillhörande information
      console.log(`ID: ${product.product_id}, Manufacturer: ${product.manufacturer_id}, Name: ${product.name}, Description: ${product.description}, Price: ${product.price}, Stock: ${product.stock_quantity}`);
  });
  
  return products; //returnera products till anroparen i app
  };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 2: GET /products/:id
// ○ Visa all information om en specifik produkt

function getProductById(id) {
let product=[];
  try { 
    const stmt = db.prepare (`
      SELECT 
      products.name AS product_name, 
      products.price AS product_price, 
      products.description AS product_description,
      products.stock_quantity AS product_stock_quantity,
      manufacturers.name AS manufacturer,
      categories.name AS category
      FROM products
      JOIN manufacturers ON products.manufacturer_id=manufacturers.manufacturer_id
      JOIN products_categories ON products_categories.product_id=products.product_id
      JOIN categories ON products_categories.category_id=categories.category_id
      WHERE products.product_id = ?;
      `); 
      
    product = stmt.get(id);
    
    } catch (err) {
     console.error ("An error occured when fetching products by id:", err);
    }

    return product;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 3: GET /products/search?name={searchterm}
// ○ Sök och lista produkter vars namn innehåller söktermen

function getProductsBySearchTerm (searchterm) {
  let products=[]; 
  try { 
    const stmt = db.prepare ('SELECT * FROM products WHERE name LIKE ?'); //LIKE för wildcard
    products = stmt.all(`%${searchterm}%`); //stmt.all() används pga att man söker efter många produkter. Wildcard för matchningarna.
    
    return products;
  
    } catch (err) {
     console.error ("An error occured because the search does not match any products:", err);
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 4: GET /products/category/:categoryId
// ○ Lista alla produkter i en specifik kategori

function getProductsByCategoryId (categoryId) {
  let result=[]; 
  try {
    const stmt = db.prepare(`
    SELECT products.product_id, products.name, products.description, categories.name AS category_name
    FROM products
    JOIN products_categories ON products.product_id=products_categories.product_id
    JOIN categories ON products_categories.category_id=categories.category_id
    WHERE categories.category_id=?
    `);
    result=stmt.all(categoryId); //.all pga ska vara många rader. .get när det är en rad. Den tomma array "result" tilldelas resultatet av stmt.all(categoryname)

  }catch (err){
    console.error(`An error occured when trying to list products from the ${categoryId}`, err);
  }
return result; //Result returneras till anroparen av funktionen
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 5: POST /products
/// ○ Skapa en ny produkt
// ○ All nödvändig produktinfo skickas i request body

function createNewProduct ({manufacturer_id, name, description, price, stock_quantity}) { //product.product_id ej med pga har AUTOINCREMENT
//destructuring, använd objektet direkt i funktionsargumentet
try {
  const stmt = db.prepare (`
    INSERT INTO products (manufacturer_id, name, description, price, stock_quantity) 
    VALUES (?,?,?,?,?)
    `); //Detta ska läggas till i databasen
  return stmt.run(manufacturer_id, name, description, price, stock_quantity); //sätt in i db
  

  } catch (err) {
    console.error('An error occured when trying to add the new product',err);
    return null; //Return null blir här samma sak som att i ifsatsen i app.js ha: if(!resultOfCreatingProduct). OBS utropstecknet.
  }
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 6: PUT /products/:id
// ○ Uppdatera en existerande produkt
// ○ Ny produktinfo skickas i request body

function updateProductById ({product_id, manufacturer_id, name, description, price, stock_quantity}) {


try {
  const stmt = db.prepare (`
    UPDATE products 
    SET manufacturer_id = ?, name = ?, description = ?, price = ?, stock_quantity = ? 
    WHERE product_id = ?`); //Säkerställer att endast produkten med det specificerade id uppdateras.

  return stmt.run(manufacturer_id, name, description, price, stock_quantity, product_id);

  } catch (err) {
    console.error('An error occured when trying to update the product',err); //Loggar felmeddelande i konsollen.
    return null; //Felhantering. Returnerar null till anroparen för att visa att det gick fel. Kan kombineras med en if-sats hos anroparen (if result === null //Kod som ska köras) else //kod som ska köras).
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Uppgift 7: DELETE /products/:id
// ○ Ta bort en produkt
// ○ Ska även ta bort alla produktens recensioner (CASCADE DELETE). DETTA ÄR IMPLEMENTERAT I SQL I NILS NYA DB TECHGEAR.

function deleteProductById (product_id) {
  try {
    const stmt = db.prepare('DELETE FROM products WHERE product_id = ?');
    return stmt.run(product_id);


  } catch (err) {
    console.error('Error!', err);
    return null; //Returnera null till anroparen för att visa att det gick fel. Se ovan.
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Kundhantering
//Uppgift 1: GET /customers/:id
// ○ Visa kundinformation
// ○ Inkludera orderhistorik via JOIN med orders-tabellen

function getCustomerInfoById (customerid) {
  let customer=[]; //En array med kundobjekten

  try {
    const stmt = db.prepare (`
    SELECT  customers.customer_id, 
            customers.name, 
            customers.email, 
            customers.phone, 
            customers.address,  
            orders.order_id, 
            orders.order_date
            FROM customers 
            JOIN orders ON customers.customer_id = orders.customer_id 
            WHERE customers.customer_id = ?
      `); //I JOINEN tar jag ej med customer.password pga detta kan vara olämpligt/ej relevant att visa. 
          //JOIN (INNER JOIN) pga vill endast ha de kunder som HAR orders. 
      customer = stmt.all(customerid);

  } catch (err) {
    console.error('Error!', err); //Felhantering för utvecklaren
    return null; 
  }

  return customer;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 2: PUT /customers/:id
// ○ Uppdatera kundens kontaktuppgifter (email, telefon, adress)

function updateCustomerInfoById ({email, phone, address, customerId}) {
  try {
    const stmt = db.prepare('UPDATE customers SET email = ?, phone = ?, address = ? WHERE customer_id = ?');
    return stmt.run(email, phone, address, customerId);


  } catch (err) {
    console.error('An error occured when trying to update the customerinfo', err);
    return null;
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Uppgift 3: GET /customers/:id/orders
// ○ Lista alla ordrar för en specifik kund

function listAllOrdersOfSpecificCustomer (customerid) {
  let ordersOfaCustomer = [];

  try {
    const stmt = db.prepare(`
      SELECT orders.order_id, 
      orders.order_date,
      orders_products.product_id, 
      customers.customer_id, 
      customers.name AS customer_name,  
      products.name AS product_name
      FROM orders
      JOIN customers ON orders.customer_id = customers.customer_id
      JOIN products ON orders_products.product_id = products.product_id
      JOIN orders_products ON orders.order_id = orders_products.order_id
      WHERE customers.customer_id = ?
      `);

    ordersOfaCustomer = stmt.all(customerid);
    return ordersOfaCustomer;

  } catch (err) {
    console.error('An error occured when trying to list the orders', err);
    return null;
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*Analysdata
Uppgift 1: GET /products/stats
○ Visa statistik grupperad per kategori:
 -Antal produkter per kategori
 -Genomsnittligt pris per kategori
 */

 function statsPerCategory () {

  let stats=[];

  try {
    const stmt = db.prepare(`
      SELECT
      categories.name AS category_name, 
      COUNT(products.product_id) AS the_number_of_products_in_the_category, 
      ROUND(AVG(products.price), 0) AS average_price_of_product_in_the_category
      FROM products_categories
      JOIN products ON products_categories.product_id = products.product_id
      JOIN categories ON products_categories.category_id = categories.category_id
      GROUP BY categories.name
      `);

      //COUNT räknar antal produkter i varje kategori
      //AVG () är en funktion som returnerar medelvärdet i en kolumn (numerisk kolumn alltså)
      //ROUND () är en funktion som rundar av tal. Noggrannheten måste specificeras, jag väljer här 0 decimaler. Antalet decimaler blir här ohanterligt utan ROUND (). 
    
    stats = stmt.all();
    return stats;


  } catch (err){
    console.error('Error when trying to display the statistics', err);
    return null; //else i app.js kommer att skicka en 404
  }
 };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*Uppgift 2: GET /reviews/stats
○ Visa genomsnittligt betyg per produkt
○ Använd GROUP BY för att sammanställa data
*/

function averagePoints () {

let average=[];

  try {
    const stmt = db.prepare(`
      SELECT 
      products.name,
      ROUND(AVG(reviews.rating), 0) AS average_rating_of_product_from_1_to_5
      FROM reviews
      JOIN products ON reviews.product_id=products.product_id
      GROUP BY products.name; 
    `);

    average = stmt.all();
    return average;


  } catch (err) {
    console.error('There was an error when trying to calculate the average points', err);
    return null; //Om null returneras betyder det att datan (dvs genomsnittsbetyget) ej kunde hämtas av funktionen --> error 404.
  }
};