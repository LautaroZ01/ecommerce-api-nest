import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNumber, IsPositive, IsInt, IsOptional } from 'class-validator';

export class CreateProductDto {

    @ApiProperty({
        description: 'Product Title (unique)',
        nullable: false,
        minLength: 1,
        example: 'Monitor Samsung 24"'
    })
    @IsString()
    @MinLength(3)
    name: string;

    @ApiProperty({
        description: 'Price in local currency',
        example: 150.50
    })
    @IsNumber()
    @IsPositive()
    price: number;

    @ApiProperty({
        description: 'Stock quantity',
        example: 10
    })
    @IsInt()
    @IsPositive()
    stock: number;

    @ApiProperty({
        description: 'Product Description',
        example: 'A high-quality monitor with 24-inch display and 144Hz refresh rate'
    })
    @IsString()
    @IsOptional()
    description?: string;
}