export default jest.fn(() => ({
  id: 'email',
  type: 'email',
  name: 'Email',
  server: {},
  from: '',
  maxAge: 24 * 60 * 60,
  sendVerificationRequest: jest.fn(),
  options: {}
}));