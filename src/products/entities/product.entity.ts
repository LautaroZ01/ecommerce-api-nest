import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('decimal', { default: 0 })
    price: number;

    @Column('int', { default: 0 })
    stock: number;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}