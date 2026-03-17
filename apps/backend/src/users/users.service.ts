import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('Phone number already registered');
    }
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { phone } });
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { clerkId } });
  }

  async findOrCreateByClerk(clerkId: string, name: string, phone: string): Promise<User> {
    let user = await this.findByClerkId(clerkId);
    if (user) return user;

    // Check if phone already exists (migration case)
    user = await this.findByPhone(phone);
    if (user) {
      user.clerkId = clerkId;
      return this.userRepo.save(user);
    }

    const newUser = this.userRepo.create({ clerkId, name, phone });
    return this.userRepo.save(newUser);
  }
}
