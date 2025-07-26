import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import axios from 'axios';

const app = express();
const port = 3000;

const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'booknotes',
    password: '061408!',
    port: 5433,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

db.connect();

const safeQuery = (query, params) => {
    return db.query(query, params)
        .then((result) => result.rows)
        .catch((error) => {
            console.error('Database query error:', error);
            throw new Error(`Query failed: ${query}`);
        });
};


app.get('/', async (req, res) => {
    const sortOption = req.query.sort;
  
    let orderByClause;
    switch (sortOption) {
      case 'date_asc':
        orderByClause = 'ORDER BY date ASC';
        break;
      case 'rating_desc':
        orderByClause = 'ORDER BY rating DESC';
        break;
      case 'date_desc':
      default:
        orderByClause = 'ORDER BY date DESC';
        break;
      case 'rating_asc':
        orderByClause = 'ORDER BY rating ASC';
    }
  
    const books = await safeQuery(`SELECT * FROM books ${orderByClause} LIMIT 10`);
  
    books.forEach((book) => {
      book.coverImage = `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`;
    });
  
    if (books.length === 0) {
      return res.render('index.ejs', { error: 'No books found.' });
    }
  
    res.render('index.ejs', { books, sortOption, error: null });
  });
  

  app.get('/edit', async (req, res) => {
    const bookId = req.query.id;
    const books = await safeQuery('SELECT * FROM books WHERE id = $1', [bookId]);

    if (books.length === 0) {
        return res.render('index.ejs', { books, error: 'Book not found.' });
    }

    res.render('edit.ejs', { book: books[0], sortOption: '', error: null });

});

app.post('/edit', async (req, res) => {
    const updatedBook = req.body;
  
    // Fetch the original book from the database
    const [originalBook] = await safeQuery('SELECT * FROM books WHERE id = $1', [updatedBook.id]);
  
    if (!originalBook) {
      console.error('Book not found for update.');
      return res.status(404).send('Book not found');
    }
  
    // If the submitted date matches the original, keep it; else use the new one
    const finalDate = updatedBook.date === originalBook.date ? originalBook.date : updatedBook.date;
  
    const [result, error] = await safeQuery(
      `UPDATE books 
       SET title = $1, author = $2, date = $3, notes = $4, isbn = $5, rating = $6 
       WHERE id = $7 
       RETURNING *`,
      [updatedBook.title, updatedBook.author, finalDate, updatedBook.notes, updatedBook.isbn, updatedBook.rating, updatedBook.id]
    );
  
    if (error) {
        console.error('Error adding book:', error);
        return res.render('add.ejs', {
          sortOption: '',
          error: 'Something went wrong while saving the book. Please try again.',
        });
      }
      
    res.redirect('/');
  });
  
app.get('/add', async (req, res) => {
    try {
        res.render('add.ejs',
            { sortOption: '', // Passing an empty sort option for the add page to avoid reference error.
            error: null,
        });
    } catch (error) {
        console.error('Error fetching books from Open Library:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/search', async (req, res) => {
    const query = req.query.q;
    try {
      const response = await axios.get(`https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=5`);
      const books = response.data.docs.map(doc => ({
        title: doc.title,
        author: doc.author_name ? doc.author_name[0] : 'Unknown',
        isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : '',
        coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg` : 'https://via.placeholder.com/150',
      }));
      
      res.json(books);
    } catch (error) {
      console.error("Search API error:", error);
      res.status(500).json({ error: 'Something went wrong.' });
    }
  });
  

app.post('/add', async (req, res) => {
    const { title, author, date, notes, isbn, rating } = req.body;
    
    const [result, error] = await safeQuery(
        'INSERT INTO books (title, author, date, notes, isbn, rating) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [title, author, date, notes, isbn, rating]
    );
    if (error) {
        console.error('Error adding book:', error);
        return res.render('add.ejs', {
          sortOption: '',
          error: 'Something went wrong while saving the book. Please try again.',
        });
      }
      
    res.redirect('/');
});



app.get('/delete', async (req, res) => {
    const bookId = req.query.id;
    const [result, error] = await safeQuery('DELETE FROM books WHERE id = $1', [bookId]);
    if (error) {
        console.error('Error deleting book:', error);
        return res.status(500).send('Internal Server Error');
    }
    res.redirect('/');
});



app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});