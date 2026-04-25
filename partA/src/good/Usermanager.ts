// Хэрэглэгчийн өгөгдлийн бүтэц
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Хэрэглэгч үүсгэхэд хэрэглэх
export interface CreateUserInput {
  email: string;
  name: string;
}

// Хэрэглэгч шинэчлэхэд хэрэглэх
export interface UpdateUserInput {
  email?: string;
  name?: string;
}

// Хэрэглэгч олдохгүй бол энэ алдаа шиднэ
export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundError';
  }
}

// Мэдээллийн сангийн холболтын интерфэйс
// UserManager нь ямар DB ашиглахыг мэдэх шаардлагагүй
export interface DatabaseConnection {
  query<T>(sql: string, params: unknown[]): Promise<T[]>;
  execute(sql: string, params: unknown[]): Promise<void>;
}

export class UserManager {
  // private тул гаднаас харагдахгүй
  private readonly db: DatabaseConnection;
  private readonly userCache: Map<string, User> = new Map();

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  // Шинэ хэрэглэгч үүсгэнэ
  async createUser(input: CreateUserInput): Promise<User> {
    /* ... */
    return {} as User;
  }

  // Хэрэглэгчийн мэдээллийг шинэчилнэ, олдохгүй бол UserNotFoundError шиднэ
  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    /* ... */
    return {} as User;
  }

  // Хэрэглэгчийг устгана (soft delete)
  async deleteUser(userId: string): Promise<void> {
    /* ... */
  }

  // Устгасан хэрэглэгчийг буцааж сэргээнэ
  async restoreUser(userId: string): Promise<User> {
    /* ... */
    return {} as User;
  }

  // ID-р хайна, олдохгүй бол UserNotFoundError шиднэ
  async findUserById(userId: string): Promise<User> {
    /* ... */
    return {} as User;
  }

  // Email-р хайна, олдохгүй бол UserNotFoundError шиднэ
  async findUserByEmail(email: string): Promise<User> {
    /* ... */
    return {} as User;
  }

  // Нэр эсвэл email-р хайна
  async searchUsers(query: string): Promise<User[]> {
    /* ... */
    return [];
  }
}