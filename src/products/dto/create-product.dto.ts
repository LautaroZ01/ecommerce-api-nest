import { IsString, MinLength, IsNumber, IsPositive, IsInt, IsOptional } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsNumber()
    @IsPositive()
    price: number;

    @IsInt()
    @IsPositive()
    stock: number;

    @IsString()
    @IsOptional()
    description?: string;
}