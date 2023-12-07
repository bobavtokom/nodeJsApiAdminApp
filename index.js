const express = require('express');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('server ready');
});
app.get('/newUser', (req, res) => {
    res.render('newUser');
  });

  app.post('/submit', (req, res) => {
    const { number, email } = req.body;
    res.send(`Form submitted! Number: ${number}, Email: ${email}`);
  });
  

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});