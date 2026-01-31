import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';
import { User } from './entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  // 1. Endpoint para que el ADMIN gestione usuarios (banear, cambiar roles)
  @Patch(':id')
  @Auth(ValidRoles.admin) // Solo admin
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() adminUser: User // Opcional: para logs de auditoría
  ) {
    return this.usersService.update(id, updateUserDto, adminUser);
  }

  // 2. Endpoint Opcional: Si quisieras que un usuario se edite a sí mismo,
  // NO deberías pedir el ID en la URL (seguridad), sino sacarlo del token.
  @Patch('me')
  @Auth()
  updateProfile(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
