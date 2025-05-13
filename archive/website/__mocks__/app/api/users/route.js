/**
 * Mock Users API Route for Tests
 */

const { NextResponse } = require('next/server');

// GET handler to retrieve all users
const GET = jest.fn().mockImplementation(async (req) => {
  return NextResponse.json([
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    },
    {
      id: 2,
      username: 'user',
      email: 'user@example.com',
      role: 'user'
    }
  ]);
});

// POST handler to create a new user
const POST = jest.fn().mockImplementation(async (req) => {
  const body = await req.json();
  
  // Basic validation
  if (!body.username || !body.email || !body.password) {
    return NextResponse.json(
      { message: 'Username, email, and password are required' },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { message: 'User created successfully', userId: 3 },
    { status: 201 }
  );
});

module.exports = {
  GET,
  POST
};
