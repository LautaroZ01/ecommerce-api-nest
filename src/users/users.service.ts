import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.userRepository.create(createUserDto);
      await this.userRepository.save(user); // Esperamos a que guarde


      delete user.password; // Limpiamos el campo antes de devolverlo
      return user;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  // Este método es especial para uso interno (Auth)
  async findOneByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      select: { id: true, email: true, password: true, roles: true, fullname: true, isActive: true }, // Forzamos que traiga el password
      // O también podrías usar: 
      // select: ['id', 'password', 'email', 'roles', 'fullname']
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, adminUser?: User) {
    // 1. Preparamos el objeto con los nuevos datos
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    try {
      // 2. Si se está cambiando la contraseña, el Hook @BeforeUpdate de la entidad se encargará de hashearla
      //    al hacer el .save(), siempre y cuando la entidad esté configurada correctamente.

      // 3. Guardamos
      await this.userRepository.save(user);

      // 4. Limpiamos password antes de devolver
      delete user.password;
      return user;

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
