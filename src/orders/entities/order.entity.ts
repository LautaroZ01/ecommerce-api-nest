import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
// La crearemos en el paso 3

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Relación: Muchas órdenes pertenecen a un usuario
    @ManyToOne(() => User, (user) => user.orders, { eager: true }) // Eager carga al usuario automáticamente
    user: User;

    @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
    items: OrderItem[];

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    total: number; // Suma de todos los items

    @Column('text', { default: 'PENDING' }) // PENDING, COMPLETED, CANCELLED
    status: string;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}