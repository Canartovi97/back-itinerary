import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/user.entity';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const entity = this.repo.create({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: UserOrmEntity): User {
    return User.create({
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      createdAt: entity.createdAt,
    });
  }
}
