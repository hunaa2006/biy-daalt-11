function paginate(array, query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const total = array.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = array.slice(start, start + limit);
  return { data, page, limit, total, totalPages };
}

function sortAndFilter(array, query, allowedSort = []) {
  let result = [...array];

  // Filter by genre, author, title (partial, case-insensitive)
  if (query.title) result = result.filter(b => b.title?.toLowerCase().includes(query.title.toLowerCase()));
  if (query.author) result = result.filter(b => b.author?.toLowerCase().includes(query.author.toLowerCase()));
  if (query.genre) result = result.filter(b => b.genre?.toLowerCase() === query.genre.toLowerCase());
  if (query.available !== undefined) result = result.filter(b => String(b.availableCopies > 0) === query.available);

  // Sort
  if (query.sort && allowedSort.includes(query.sort)) {
    const dir = query.order === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      if (a[query.sort] < b[query.sort]) return -1 * dir;
      if (a[query.sort] > b[query.sort]) return 1 * dir;
      return 0;
    });
  }

  return result;
}

module.exports = { paginate, sortAndFilter };