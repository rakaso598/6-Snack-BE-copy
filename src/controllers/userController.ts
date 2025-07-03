import UserService from "../services/userService";

class UserController {
  constructor(private userService = new UserService()) { }

  async createUser(req: any, res: any) {
    const user = await this.userService.createUser(req.body);
    res.json(user);
  }

  async getAllUsers(req: any, res: any) {
    const users = await this.userService.getAllUsers();
    res.json(users);
  }

  async getUserById(req: any, res: any) {
    const user = await this.userService.getUserById(req.params.id);
    res.json(user);
  }

  async updateUser(req: any, res: any) {
    const user = await this.userService.updateUser(req.params.id, req.body);
    res.json(user);
  }

  async deleteUser(req: any, res: any) {
    await this.userService.deleteUser(req.params.id);
    res.sendStatus(204);
  }
}

export default UserController;
