const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');


jest.mock('../lib/utils/github');
const registerAndLogin = async () => {
  const agent = request.agent(app);
  await agent.get('/api/v1/github/login/callback').redirects(1);

  return agent;
};

describe('gottem gitty routes', () => {
  beforeEach(() => {
    return setup(pool);
  });

  afterAll(() => {
    pool.end();
  });

  it('should redirect to the github oauth page upon login', async () => {
    const req = await request(app).get('/api/v1/github/login');

    expect(req.header.location).toMatch(
      /https:\/\/github.com\/login\/oauth\/authorize\?client_id=[\w\d]+&scope=user&redirect_uri=http:\/\/localhost:7890\/api\/v1\/github\/login\/callback/i
    );
  });

  it('should login and redirect users to /api/v1/github/dashboard', async () => {
    const req = await request
      .agent(app)
      .get('/api/v1/github/login/callback?code=42')
      .redirects(1);

    expect(req.body).toEqual({
      id: expect.any(String),
      username: 'fake_github_user',
      email: 'not-real@example.com',
      avatar: expect.any(String),
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });
  it('should log out of the app', async () => {
    await request.agent(app).get('/api/v1/github/login/callback').redirects(1);

    const response = await request.agent(app).delete('/api/v1/github');

    expect(response.body.message).toEqual('Signed out successfully!');
  });

  it('should make a new post', async () => {
    const agent = await registerAndLogin();
    const post = await agent.post('/api/v1/posts').send({ post:'testpost', userId: '2' });
    
    expect(post.body).toEqual({ id: '2', post:'testpost' });
  });

  it('should get all posts', async () => {
    const agent = await registerAndLogin();
    await agent.post('/api/v1/posts').send({ post:'testpost', userId: '2' });
    await agent.post('/api/v1/posts').send({ post:'testpost2', userId: '2' });


    const response = await agent.get('/api/v1/posts');

    expect(response.body).toEqual(expect.arrayContaining([{ id: expect.any(String), post:'testpost2' }, { id: expect.any(String), post:'testpost' }]));
  });
});

