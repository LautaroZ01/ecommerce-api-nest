import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {
      // 1. Preparamos la instancia (esto no guarda en DB todavía)
      const product = this.productRepository.create(createProductDto);
      // 2. Guardamos y esperamos la respuesta
      return await this.productRepository.save(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto; // Valores por defecto

    return await this.productRepository.find({
      take: limit,
      skip: offset,
      // relations: [], // Aquí pondremos las imágenes o categorías más adelante
    });
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // 1. Preload busca el producto por ID y le "parcha" los datos del DTO
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
    });

    // 2. Si no encontró el ID, lanzamos error
    if (!product) throw new NotFoundException(`Product with id ${id} not found`);

    // 3. Guardamos (si hubo error de DB, el handleDBExceptions que creamos antes lo atrapa)
    try {
      return await this.productRepository.save(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id); // Reutilizamos la lógica del 404
    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully' }; // O simplemente void
  }

  // Método privado para manejar errores de forma centralizada
  private handleDBExceptions(error: any) {
    if (error.code === '23505') // Código de error de Postgres para Unique Violation
      throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
