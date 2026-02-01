import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {

        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                { folder: 'gamer-store' }, // Carpeta en tu Cloudinary
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result!);
                },
            );

            // Magia moderna para convertir Buffer a Stream
            Readable.from(file.buffer).pipe(upload);
        });
    }

    async deleteImage(secureUrl: string): Promise<any> {
        const publicId = this.getPublicIdFromUrl(secureUrl);

        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
    }

    // Método privado para extraer el ID de la URL
    // Input: https://res.cloudinary.com/.../v12345/gamer-store/teclado.jpg
    // Output: gamer-store/teclado
    private getPublicIdFromUrl(url: string): string {
        const splitUrl = url.split('/');
        const imageName = splitUrl[splitUrl.length - 1]; // teclado.jpg
        const [id] = imageName.split('.'); // teclado

        // Si usaste carpetas (gamer-store), hay que reconstruirlo. 
        // Dependiendo de tu estructura exacta, esto puede variar.
        // Una forma más segura si siempre usas la carpeta 'gamer-store':
        const folder = 'gamer-store';
        return `${folder}/${id}`;
    }
}