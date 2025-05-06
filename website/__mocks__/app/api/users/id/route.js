/**
 * Mock User ID API Route for Tests
 */

const { NextResponse } = require('next/server');

// GET handler to retrieve a specific user
const GET = jest.fn().mockImplementation(async (req, { params }) => {
  const id = params?.id || '1';
  
  if (id === '1') {
    return NextResponse.json({
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    });
  } else if (id === '2') {
    return NextResponse.json({
      id: 2,
      username: 'user',
      email: 'user@example.com',
      role: 'user'
    });
  }
  
  return NextResponse.json(
    { message: 'User not found' },
    { status: 404 }
  );
});

// PUT handler to update a user
const PUT = jest.fn().mockImplementation(async (req, { params }) => {
  const id = params?.id || '1';
  const body = await req.json();
  
  if (id === '999') {
    return NextResponse.json(
      { message: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(
    { message: 'User updated successfully' },
    { status: 200 }
  );
});

// DELETE handler to delete a user
const DELETE = jest.fn().mockImplementation(async (req, { params }) => {
  const id = params?.id || '1';
  
  if (id === '999') {
    return NextResponse.json(
      { message: 'User not found' },
      { status: 404 }
    );
  }
  
  if (id === '1') {
    return NextResponse.json(
      { message: 'Cannot delete admin user' },
      { status: 403 }
    );
  }
  
  return NextResponse.json(
    { message: 'User deleted successfully' },
    { status: 200 }
  );
});

module.exports = {
  GET,
  PUT,
  DELETE
};
