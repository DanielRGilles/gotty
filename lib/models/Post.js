const pool = require('../utils/pool');

module.exports = class Post {
  id;
  post;
  userId;

  constructor(row) {
    this.id = row.id;
    this.post = row.post;
    this.userId = row.githubUser_id;
  }

  static async insert({ post, userId }) {
    const { rows } = await pool.query(
      `
        INSERT INTO posts ( post, githubUser_id )
        Values ($1, $2)
        Returning *
      `,
      [post, userId]
    );
    return new Post(rows[0]);
  }
  
  static async getAll() {
    const { rows } = await pool.query('SELECT * FROM posts');
    return rows.map((row) => new Post(row));
  }
};
