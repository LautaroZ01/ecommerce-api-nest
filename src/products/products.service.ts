import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ProductImage } from './entities/product-image.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {
      // Desestructuramos para sacar las imágenes aparte
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        // Aquí ocurre la magia: TypeORM ve strings, crea instancias de ProductImage
        images: images.map(image => this.productRepository.manager.create(ProductImage, { url: image }))
      });

      await this.productRepository.save(product);

      return { ...product, images }; // Devolvemos el producto con las URLs planas

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: { // Si usaste eager: true en la entidad, esta línea sobra, pero es explícita
        images: true,
      }
    });

    // Mapeamos para devolver solo las URLs
    return products.map(product => ({
      ...product,
      images: product.images?.map(img => img.url)
    }));
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) throw new NotFoundException(`Product with id ${id} not found`);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;

    // 1. Preparamos el producto (solo con los datos simples, SIN imágenes)
    const product = await this.productRepository.preload({
      id,
      ...toUpdate, // Aquí ya no hay 'images', así que TypeScript no se quejará
    });

    if (!product) throw new NotFoundException(`Product with id ${id} not found`);

    // 2. Iniciamos la transacción (porque vamos a borrar e insertar fotos)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Si vienen imágenes, borramos las viejas y preparamos las nuevas
      // Variable auxiliar para guardar qué URLs borraremos de la nube al final
      let imagesToDeleteFromCloudinary: string[] = [];

      if (images) {
        // 1. Buscamos las imágenes que existen actualmente en la DB
        const currentImages = await this.productImageRepository.findBy({ product: { id } });

        // 2. IMPORTANTE: Filtramos. 
        // Solo borramos de Cloudinary las que NO vienen en el nuevo array de 'images'.
        imagesToDeleteFromCloudinary = currentImages
          .filter(img => !images.includes(img.url)) // Si la URL vieja NO está en las nuevas -> Borrar
          .map(img => img.url);

        // 3. Borramos TODAS las filas de la DB para este producto
        // (Esto está bien, borramos la relación en DB, pero el archivo físico de Cloudinary 
        // solo se borrará si está en la lista imagesToDeleteFromCloudinary)
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        // 4. Insertamos las nuevas filas (que pueden incluir URLs viejas reutilizadas y nuevas)
        product.images = images.map(
          image => this.productRepository.manager.create(ProductImage, { url: image })
        );
      } else {
        // Opcional: Si no mandan 'images', ¿asumimos que no cambian? 
        // Entonces cargamos las actuales para no perderlas al guardar el producto.
        // Si quisieras que enviar images: [] borrara todo, la lógica de arriba funciona (borraría todo de Cloudinary).
        // Pero si images es undefined, mejor no tocar nada.
        product.images = await this.productImageRepository.findBy({ product: { id } });
      }

      // 4. Guardamos el producto (y sus imágenes gracias al cascade)
      // Usamos queryRunner.manager.save, NO this.productRepository.save
      await queryRunner.manager.save(product);

      // 5. Confirmamos transacción
      await queryRunner.commitTransaction();
      await queryRunner.release();

      // 6. Si todo salió bien en la DB, AHORA borramos de Cloudinary (Fuego y olvido)
      if (imagesToDeleteFromCloudinary.length > 0) {
        // No esperamos el await para no retrasar la respuesta al usuario
        Promise.all(imagesToDeleteFromCloudinary.map(url => this.cloudinaryService.deleteImage(url)))
          .catch(err => this.logger.error('Error deleting images from Cloudinary', err));
      }

      // 7. Devolvemos el producto actualizado y aplanado
      // (Reutilizamos findOnePlain que crearemos abajo para no repetir lógica)
      return this.findOnePlain(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }
  }

  // Método auxiliar para devolver el producto con las imágenes aplanadas
  async findOnePlain(id: string) {
    const { images = [], ...rest } = await this.findOne(id);
    return {
      ...rest,
      images: images.map(image => image.url)
    };
  }

  async remove(id: string) {
    // 1. Buscamos el producto con sus imágenes
    const product = await this.findOne(id);

    // 2. Borramos las imágenes de Cloudinary una por una
    // Usamos Promise.all para que sea más rápido (en paralelo)
    if (product.images) {
      await Promise.all(
        product.images.map(image => this.cloudinaryService.deleteImage(image.url))
      );
    }

    // 3. Borramos el producto de la DB (TypeORM borrará las filas de imágenes por Cascade)
    await this.productRepository.remove(product);

    return { message: 'Product and images deleted successfully' };
  }

  // Método privado para manejar errores de forma centralizada
  private handleDBExceptions(error: any) {
    if (error.code === '23505') // Código de error de Postgres para Unique Violation
      throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
