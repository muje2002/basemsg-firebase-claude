import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';

const mockUsersService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: ReturnType<typeof mockUsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useFactory: mockUsersService }],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('should call service.create with dto', async () => {
    const dto = { name: 'Test', phone: '010-0000-0000' };
    const user = { id: '1', ...dto, createdAt: new Date() };
    service.create.mockResolvedValue(user);

    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('1');
  });

  it('should call service.findAll', async () => {
    service.findAll.mockResolvedValue([]);
    const result = await controller.findAll();
    expect(result).toEqual([]);
  });

  it('should call service.findOne with id', async () => {
    const user = { id: '1', name: 'Test', phone: '010-0000-0000' };
    service.findOne.mockResolvedValue(user);

    const result = await controller.findOne('1');
    expect(result.id).toBe('1');
  });
});
