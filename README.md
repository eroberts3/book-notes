# book-notes

**Ango Gablogian’s Recent Reads** — A minimalist web app built with Node.js, Express, PostgreSQL, and the Open Library API. Search, add, and catalog your reading history with notes, ratings, and automated cover images.

## Features

- Search book titles and autofill metadata (author, ISBN, cover)
- Add custom notes and rate your reads from 1–10
- View a dynamic feed of recent books, sortable by date or rating
- Edit or delete book entries instantly
- Styled with Bootstrap, some custom CSS, & Bitcount Prop Single font for UI

## Technologies

| Stack       | Tools Used                            |
|-------------|----------------------------------------|
| Backend     | Node.js, Express, Axios                |
| Database    | PostgreSQL (`pg`)                      |
| Frontend    | EJS templates, Bootstrap 5             |
| External API| [Open Library API](https://openlibrary.org/dev/docs/api/search) |

## Setup Instructions

1. Clone the repo:
   ```bash
   git clone https://github.com/eroberts3/book-notes.git
   cd book-notes
Install dependencies:

bash
npm install

Configure PostgreSQL:

Create a database named books

Ensure connection settings match the config in index.js

Start the server:

bash
node index.js
Visit http://localhost:3000 in your browser

*Notes on Functionality*
ISBN is used to pull cover images via Open Library.

Fallback logic ensures placeholder empty covers when ISBN is missing.

Search suggestions use real-time API fetch from Open Library’s /search.json.