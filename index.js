const express = require('express');
const { Pool } = require('pg');

const app = express();
//make a port with env variable or 3000
const port = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
});

// Middleware for parsing JSON in request body
app.use(express.json());

// Route handler for homepage
app.get('/', (req, res) => {
  res.send('<h1>Welcome to My App</h1>');
});

const signIn = async (username, password) => {
  try {
    // Get a client from the connection pool
    const client = await pool.connect();

    // Query the database for the user with the given username and password
    const result = await client.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);

    // Release the client back to the connection pool
    client.release();

    // If a user is found, return the user object, otherwise return null
    if (result.rows.length === 1) {
      return result.rows[0];
    } else {
      return null;
    }
  } catch (error) {
    // Handle any errors that may occur during the query
    console.error('Error signing in:', error);
    throw error;
  }
};

// Function for user registration
const register = async (username, password, balance) => {
  try {
    // Get a client from the connection pool
    const client = await pool.connect();

    // Query the database to check if the username already exists
    const usernameExists = await client.query('SELECT 1 FROM users WHERE username = $1', [username]);

    // If the username already exists, return an error
    if (usernameExists.rows.length > 0) {
      client.release();
      return { error: 'Username already exists' };
    }

    // Insert the new user into the database with the given balance
    const result = await client.query('INSERT INTO users (username, password, balance) VALUES ($1, $2, $3) RETURNING *', [username, password, balance]);

    // Release the client back to the connection pool
    client.release();

    // Return the newly registered user object
    return result.rows[0];
  } catch (error) {
    // Handle any errors that may occur during the query
    console.error('Error registering user:', error);
    throw error;
  }
};


// Function to get the balance of a user
const getBalance = async (username) => {
    try {
      // Get a client from the connection pool
      const client = await pool.connect();
  
      // Query the database to get the balance of the user with the given userId
      const result = await client.query('SELECT balance FROM users WHERE username = $1', [username]);
  
      // Release the client back to the connection pool
      client.release();
  
      // If a user is found, return the balance, otherwise return null
      if (result.rows.length === 1) {
        return result.rows[0].balance;
      } else {
        return null;
      }
    } catch (error) {
      // Handle any errors that may occur during the query
      console.error('Error getting balance:', error);
      throw error;
    }
  };
  
  // Function to set the balance of a user
  const setBalance = async (username, newBalance) => {
    try {
      // Get a client from the connection pool
      const client = await pool.connect();
  
      // Update the balance of the user with the given userId
      const result = await client.query('UPDATE users SET balance = $1 WHERE username = $2 RETURNING *', [newBalance, username]);
  
      // Release the client back to the connection pool
      client.release();
  
      // If a user is found, return the updated user object, otherwise return null
      if (result.rows.length === 1) {
        return result.rows[0];
      } else {
        return null;
      }
    } catch (error) {
      // Handle any errors that may occur during the query
      console.error('Error setting balance:', error);
      throw error;
    }
  };

// Route for signing in
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  console.log("reached here")

  try {
    const user = await signIn(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for user registration
app.post('/register', async (req, res) => {
  const { username, password, balance } = req.body;

  try {
    const user = await register(username, password, balance);
    if (user.error) {
      res.status(409).json(user);
    } else {
      res.json(user);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for getting user balance
app.get('/balance/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const balance = await getBalance(username);
    if (balance !== null) {
      res.json({ balance });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for setting user balance
app.put('/balance/:username', async (req, res) => {
  const { username } = req.params;
  const { newBalance } = req.body;

  try {
    const user = await setBalance(username, newBalance);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
