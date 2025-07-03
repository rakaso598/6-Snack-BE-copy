import UserRepository from "../repositories/userRepository";

class UserService {
  constructor(private userRepository = new UserRepository()) { }

  async createUser(data: any) {
    return this.userRepository.createUser(data);
  }

  async getAllUsers() {
    return this.userRepository.getAllUsers();
  }

  async getUserById(id: string) {
    return this.userRepository.getUserById(id);
  }

  async updateUser(id: string, data: any) {
    return this.userRepository.updateUser(id, data);
  }

  async deleteUser(id: string) {
    return this.userRepository.deleteUser(id);
  }
}

export default UserService;
