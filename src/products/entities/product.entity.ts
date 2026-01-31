import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Product {
    @ApiProperty({
        description: 'Product ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Product Name',
        example: 'Monitor Samsung 24"'
    })
    @Column('text', { unique: true })
    name: string;

    @ApiProperty({
        description: 'Product Description',
        example: 'A high-quality monitor with 24-inch display and 144Hz refresh rate'
    })
    @Column('text', { nullable: true })
    description: string;

    @ApiProperty({
        description: 'Product Price',
        example: 150.50
    })
    @Column('decimal', { default: 0 })
    price: number;

    @ApiProperty({
        description: 'Product Stock',
        example: 10
    })
    @Column('int', { default: 0 })
    stock: number;

    @ApiProperty({
        description: 'Product Creation Date',
        example: '2022-01-01T00:00:00.000Z'
    })
    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @ApiProperty({
        description: 'Product Update Date',
        example: '2022-01-01T00:00:00.000Z'
    })
    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}