import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsBoolean()
    @IsOptional()
    isActive?: boolean; // Para banear/desbanear

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    roles?: string[];
}
