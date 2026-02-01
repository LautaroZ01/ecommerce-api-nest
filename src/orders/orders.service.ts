import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from 'src/products/entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessagesWsGateway } from 'src/messages-ws/messages-ws.gateway';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger('OrdersService');

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    // Inyectamos DataSource para manejar transacciones
    private readonly dataSource: DataSource,

    // Inyección del Gateway
    private readonly messagesWsGateway: MessagesWsGateway,
  ) { }

  async create(createOrderDto: CreateOrderDto, user: User) {
    const { items } = createOrderDto;

    // 1. Crear el QueryRunner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      // Array auxiliar para guardar qué productos cambiaron
      const productsToNotify: { id: string, stock: number }[] = [];

      // 2. Iterar sobre los items solicitados
      for (const item of items) {
        // Buscamos el producto (usando el manager de la transacción para bloquear lectura si fuera necesario, aunque por ahora findOne basta)
        const product = await queryRunner.manager.findOneBy(Product, { id: item.productId });

        if (!product) {
          throw new NotFoundException(`Product with id ${item.productId} not found`);
        }

        // 3. Validar Stock
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Product ${product.name} has insufficient stock (Available: ${product.stock})`);
        }

        // 4. Calcular precio actual y restar stock
        totalAmount += product.price * item.quantity;
        product.stock -= item.quantity;

        // 5. Guardar el producto actualizado (dentro de la transacción)
        await queryRunner.manager.save(product);

        // Guardamos en nuestro array temporal
        productsToNotify.push({ id: product.id, stock: product.stock });

        // 6. Crear la instancia de OrderItem (sin guardar aún)
        const orderItem = queryRunner.manager.create(OrderItem, {
          price: product.price,
          quantity: item.quantity,
          product: product,
          // No asignamos 'order' todavía porque la orden no existe
        });

        orderItems.push(orderItem);
      }

      // 7. Crear la Orden
      const order = queryRunner.manager.create(Order, {
        user, // El usuario que viene del controlador
        items: orderItems, // TypeORM manejará la relación gracias a cascade: true
        total: totalAmount,
      });

      // 8. Guardar la orden (esto guarda también los items por cascada)
      await queryRunner.manager.save(order);

      // 9. ¡ÉXITO! Confirmamos cambios
      await queryRunner.commitTransaction();

      // 🔔 AHORA SÍ: Emitimos a todos los clientes
      productsToNotify.forEach(p => {
        this.messagesWsGateway.server.emit('stock-update', {
          productId: p.id,
          newStock: p.stock
        });
      });

      return {
        orderId: order.id,
        total: order.total,
        status: 'success'
      };

    } catch (error) {
      // 10. ¡ERROR! Deshacemos todo (el stock vuelve a sumarse)
      await queryRunner.rollbackTransaction();
      this.handleExceptions(error);
    } finally {
      // 11. Liberamos la conexión
      await queryRunner.release();
    }
  }

  async findAll(user: User) {
    return this.orderRepository.find({
      where: { user: { id: user.id } }, // Filtramos por el ID del usuario
      relations: {
        items: {
          product: true // Nested relation: Traemos los items Y el producto dentro del item
        }
      },
    });
  }

  async findOne(id: string, user: User) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        user: true, // Necesitamos cargar el usuario de la orden para comparar
        items: {
          product: true
        }
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    // Validación de seguridad:
    // Si el usuario NO es admin Y la orden NO es suya -> Error
    if (user.roles.includes('admin') === false && order.user.id !== user.id) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }


  private handleExceptions(error: any) {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error; // Re-lanzamos errores conocidos
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Check server logs');
  }
}
