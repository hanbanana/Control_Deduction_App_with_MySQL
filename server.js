var express = require("express");
var bodyParser = require("body-parser");
var session = require('express-session');
var path = require('path');

var app = express();
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Set the port of our application
// process.env.PORT lets the port be set by Heroku
var PORT = process.env.PORT || 8080;
var staticIP = "10.10.10.40";

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var mysql = require("mysql");

var connection = mysql.createConnection({
  host: 'localhost',
  port:3306,
  user: 'root',
  password: 'root',
  database: 'bc_deduction'
});

connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log("connected as id " + connection.threadId);
});

// caching disabled for every route
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname + '/views/login.html'));
});
app.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

var authUser = function(req, res, next) {
  if (req.session && req.session.user === "user1"  && req.session.customer)
    return next();
  else
    return res.sendStatus(401);
};
var authAdmin = function(req, res, next) {
  if (req.session && req.session.user === "admin1"  && req.session.admin)
    return next();
  else
    return res.sendStatus(401);
};

app.post('/auth', function (request, response) {
  var username = request.body.username;
  var password = request.body.password;
 
      if (username === "user1" && password === "user1") {
        request.session.customer= true;
        request.session.user = "user1";
        
        response.redirect('/customer');
      } 
     else if (username === "admin1" && password === "admin1") {
        request.session.admin= true;
        request.session.user = "admin1";
        
        response.redirect('/BC_Deduction');
      }
      else {
        response.send('Incorrect Username and/or Password!');
      }
      response.end();
    
 
});

// Use Handlebars to render the main index.html page with the todos in it.
app.get("/BC_Deduction", authAdmin, function (req, res) {
  connection.query("SELECT * FROM b_division;", function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    
    else if (req.session.user === "admin1" || req.session.admin) {
      res.render("index", { deliveryOrder: data });
    }
    else {
      res.send('Please login to view this page!');
    }


  });
});

app.get("/master_division", authAdmin, function (req, res) {
  connection.query("SELECT * FROM b_division;", function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    
    else if (req.session.user === "admin1" || req.session.admin) {
      res.render("master_division", { deliveryOrder: data });
    }
    else {
      res.send('Please login to view this page!');
    }


  });
});

app.get("/searchTruck", authAdmin, function (req, res) {
  connection.query("SELECT * FROM b_division;", function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    
    else if (req.session.user === "admin1" || req.session.admin) {
      res.render("searchTruck", { deliveryOrder: data });
    }
    else {
      res.send('Please login to view this page!');
    }


  });
});

app.get("/customer", authUser, function (req, res) {
  connection.query("SELECT * FROM b_division WHERE Close_ = 'No';", function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    
    else if (req.session.user === "user1") {
      res.render("customer", { deliveryOrder: data });
    }
    else {
      res.send('Please login to view this page!');
    }
  });
});

app.get("/contact", function (req, res) {
  connection.query("SELECT * FROM b_division;", function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    else if (req.session.user === "user1"){
    res.render("contact", { deliveryOrder: data });};
  });
});

app.get("/create", function (req, res) {
  connection.query("SELECT * FROM b_division;", function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    else if (req.session.user === "admin1") {
    res.render("create", { deliveryOrder: data });};
  });
});

app.get("/b_division_pages/create_b_division", function (req, res) {
  connection.query("SELECT * FROM b_division;", function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    else if (req.session.user === "admin1") {
    res.render("b_division_pages/create_b_division", { deliveryOrder: data });};
  });
});

app.get("/createTruck", function (req, res) {
  connection.query("SELECT * FROM b_division;", function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    else if (req.session.user === "admin1") {
    res.render("createTruck", { deliveryOrder: data });};
  });
});

app.get("/b_division_pages/edit_b_division/:id", function (req, res) {
  connection.query("SELECT * FROM b_division where id = ?", [req.params.id], function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    else if (req.session.user === "admin1") {
    console.log(data);
    res.render("b_division_pages/edit_b_division", data[0]);};
  });
});

app.get("/b_division_pages/delete_b_division/:id", function (req, res) {
  connection.query("SELECT * FROM b_division where id = ?", [req.params.id], function (err, data) {
    if (err) {
      return res.status(500).end();
    }
    else if (req.session.user === "admin1") {
    console.log(data);
    res.render("b_division_pages/delete_b_division", data[0]);};
  });
});

// Create a new todo
app.post("/b_division_list", function (req, res) {
  connection.query("INSERT INTO b_division (div_code, div_name) VALUES (?, ?)",
    [req.body.div_code, req.body.div_name], function (err, result) {
      if (err) {
        return res.status(500).end();
      }

      // Send back the ID of the new todo
      res.json({ id: result.insertId });
      console.log({ id: result.insertId });
    });
});

// Retrieve all todos
app.get("/b_division_list", function (req, res) {
  connection.query("SELECT * FROM b_division;", function (err, data) {
    if (err) {
      return res.status(500).end();
    }

    res.json(data);
  });
});

// Update a todo
app.put("/b_division_list/:id", function (req, res) {
  connection.query("UPDATE b_division SET div_code = ?, div_name = ? WHERE id = ?",
    [req.body.div_code, req.body.div_name, req.params.id],
    function (err, result) {
      if (err) {
        // If an error occurred, send a generic server failure
        return res.status(500).end();
      }
      else if (result.changedRows === 0) {
        // If no rows were changed, then the ID must not exist, so 404
        return res.status(404).end();
      }
      res.status(200).end();

    });
});

// Delete a todo
app.delete("/b_division_list/:id", function (req, res) {
  connection.query("DELETE FROM b_division WHERE id = ?", [req.params.id], function (err, result) {
    if (err) {
      // If an error occurred, send a generic server failure
      return res.status(500).end();
    }
    else if (result.affectedRows === 0) {
      // If no rows were changed, then the ID must not exist, so 404
      return res.status(404).end();
    }
    res.status(200).end();

  });
});

// Start our server so that it can begin listening to client requests.
app.listen(PORT, staticIP, function () {
  // Log (server-side) when our server has started
  console.log("Server listening on: " + staticIP + ":" + PORT);
});

// app.listen(process.env.PORT);





// Delete a todo
// app.delete("/todos/:id", function (req, res) {
//   connection.query("DELETE FROM deliveryOrder WHERE id = ?", [req.params.id], function (err, result) {
//     if (err) {
//       // If an error occurred, send a generic server failure
//       return res.status(500).end();
//     }
//     else if (result.affectedRows === 0) {
//       // If no rows were changed, then the ID must not exist, so 404
//       return res.status(404).end();
//     }
//     res.status(200).end();

//   });
// });

// app.get('/home', function (request, response) {
//   if (request.session.loggedin) {
//     response.send('Welcome back, ' + request.session.username + '!');
//   } else {
//     response.send('Please login to view this page!');
//   }
//   response.end();
// });

// app.get('/admin', function (request, response) {
//   if (request.session.loggedin) {
//     response.send('Welcome back, ' + request.session.username + '!');
//   } else {
//     response.send('Please login to view this page!');
//   }
//   response.end();
// });



// app.get("/", function (req, res) {
//   connection.query("SELECT * FROM deliveryOrder;", function (err, data) {
//     if (err) {
//       return res.status(500).end();
//     }

//     res.render("wrongPage", { deliveryOrder: data });
//   });
// });

// app.get("/gate/DeliveryOrder", function (req, res) {
//   connection.query("SELECT * FROM deliveryOrder;", function (err, data) {
//     if (err) {
//       return res.status(500).end();
//     }

//     res.render("index", { deliveryOrder: data });
//   });
// });













