// In-memory data store
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const db = {
  books: [
    { id: 'b1', title: 'The Pragmatic Programmer', author: 'David Thomas', isbn: '978-0135957059', genre: 'Technology', available: true, totalCopies: 3, availableCopies: 3, createdAt: new Date('2024-01-01').toISOString() },
    { id: 'b2', title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', genre: 'Technology', available: true, totalCopies: 2, availableCopies: 2, createdAt: new Date('2024-01-02').toISOString() },
    { id: 'b3', title: 'Design Patterns', author: 'Gang of Four', isbn: '978-0201633610', genre: 'Technology', available: true, totalCopies: 1, availableCopies: 1, createdAt: new Date('2024-01-03').toISOString() },
    { id: 'b4', title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0547928227', genre: 'Fiction', available: true, totalCopies: 2, availableCopies: 2, createdAt: new Date('2024-01-04').toISOString() },
    { id: 'b5', title: 'Dune', author: 'Frank Herbert', isbn: '978-0441013593', genre: 'Science Fiction', available: true, totalCopies: 2, availableCopies: 2, createdAt: new Date('2024-01-05').toISOString() },
    { id: 'b6', title: '1984', author: 'George Orwell', isbn: '978-0451524935', genre: 'Fiction', available: true, totalCopies: 3, availableCopies: 3, createdAt: new Date('2024-01-06').toISOString() },
  ],
  members: [
    { id: 'm1', name: 'Admin User', email: 'admin@library.mn', password: bcrypt.hashSync('admin123', 10), role: 'admin', activeLoans: 0, createdAt: new Date('2024-01-01').toISOString() },
    { id: 'm2', name: 'Bat-Erdene', email: 'bat@library.mn', password: bcrypt.hashSync('pass123', 10), role: 'member', activeLoans: 0, createdAt: new Date('2024-01-02').toISOString() },
    { id: 'm3', name: 'Oyunaa', email: 'oyunaa@library.mn', password: bcrypt.hashSync('pass123', 10), role: 'member', activeLoans: 0, createdAt: new Date('2024-01-03').toISOString() },
  ],
  loans: [],
  reservations: [],
};

module.exports = { db, uuidv4 };