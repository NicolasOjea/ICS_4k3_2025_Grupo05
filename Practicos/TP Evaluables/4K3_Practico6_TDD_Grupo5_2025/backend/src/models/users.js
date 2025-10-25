// "DB" en memoria para usuarios, compartida entre controladores.
const users = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', password: 'secret' },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com', password: 'secret' },
  { id: 3, name: 'Joaquin Rodriguez', email: 'joaignaciorod@gmail.com', password: 'secret' }
];

let nextId = users.length + 1;

export function getAllUsers() {
  return users;
}

export function findUserById(id) {
  return users.find(u => u.id === Number(id));
}

export function findUserByEmail(email) {
  return users.find(u => u.email === email);
}

export function addUser({ name, email, password }) {
  const user = { id: nextId++, name, email, password };
  users.push(user);
  return user;
}

export default { getAllUsers, findUserById, findUserByEmail, addUser };
