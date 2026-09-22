const FILTER_FIELDS = ['status', 'priority', 'category', 'isPublic', 'dueDate', 'createdAt', 'tags'];
const SORT_FIELDS = new Set(['createdAt', 'dueDate', 'priority', 'title']);

class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = {};
    for (const field of FILTER_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(this.queryString, field)) {
        queryObj[field] = this.queryString[field];
      }
    }

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search() {
    if (this.queryString.search) {
      this.query = this.query.find({
        $text: { $search: this.queryString.search },
      });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .filter((entry) => SORT_FIELDS.has(entry.replace(/^-/, '')))
        .map((entry) => {
          const descending = entry.startsWith('-');
          const field = entry.replace(/^-/, '');
          const mappedField = field === 'priority' ? 'priorityRank' : field;
          return `${descending ? '-' : ''}${mappedField}`;
        })
        .join(' ');

      this.query = this.query.sort(sortBy || '-createdAt');
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  paginate() {
    const page = Math.max(1, parseInt(this.queryString.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(this.queryString.limit) || 10));
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = ApiFeatures;
