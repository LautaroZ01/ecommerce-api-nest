import { IsArray, IsNotEmpty, IsUUID, ValidateNested, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
    @IsUUID()
    productId: string;

    @IsInt()
    @IsPositive()
    quantity: number;
}

export class CreateOrderDto {
    @IsArray()
    @ValidateNested({ each: true }) // Valida cada objeto dentro del array
    @Type(() => OrderItemDto)       // Necesario para que class-transformer sepa que son objetos OrderItemDto
    items: OrderItemDto[];
}