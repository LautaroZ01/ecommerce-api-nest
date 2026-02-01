import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import cookieParser from 'cookie-parser';

describe('ProductsController (e2e)', () => {
    let app: INestApplication;
    let jwtToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // 1. CONFIGURACIÓN CRÍTICA: Prefijo Global
        app.setGlobalPrefix('api'); // <--- ¡Esto faltaba! Por eso daba 404

        // 2. CONFIGURACIÓN CRÍTICA: Cookies
        app.use(cookieParser()); // <--- Necesario para que el Auth guarde/lea cookies

        // 3. Pipes (que ya tenías)
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    // 1. Primer Test: Loguearse para obtener el token
    it('/auth/login (POST) - Get Token', async () => {
        // Nota: Asegúrate de tener este usuario creado en tu DB de TEST
        // O idealmente, créalo en el 'beforeAll'
        const loginDto = {
            email: 'test@admin.com', // Crea este usuario manualmente en ecommerce_test o usa un seed
            password: 'Password123!',
        };

        const response = await request(app.getHttpServer())
            .post('/api/auth/login') // Asegúrate de poner el prefijo /api si lo configuraste en main.ts
            .send(loginDto)
            .expect(201); // O 200 según tu controller

        // Guardamos el token de la cookie para los siguientes tests
        // Como supertest maneja cookies diferente, vamos a asumir que tu login devuelve el token en el body 
        // SOLO si activaste devolver token en JSON para debug.
        // Si no, hay que leer la cookie del header 'set-cookie'.

        // Para simplificar este test: Asumiremos que habilitaste temporalmente devolver { token } en el JSON del login
        // O leeremos la cookie:
        const cookies = response.headers['set-cookie'];

        if (!cookies || !Array.isArray(cookies)) {
            throw new Error('Authentication cookie not found');
        }

        const authCookie = cookies.find((c) =>
            c.startsWith('Authentication=')
        );

        if (!authCookie) {
            throw new Error('Authentication cookie not found');
        }

        // Extraemos el valor para usarlo en el header de los siguientes request (o enviamos la cookie completa)
        jwtToken = authCookie;
    });

    // 2. Segundo Test: Crear producto SIN token (Debe fallar)
    it('/products (POST) - Fail without Auth', () => {
        return request(app.getHttpServer())
            .post('/api/products')
            .send({ name: 'Test Product', price: 100 })
            .expect(401); // Unauthorized
    });

    // 3. Tercer Test: Crear producto CON token (Debe funcionar)
    it('/products (POST) - Success', async () => {
        return request(app.getHttpServer())
            .post('/api/products')
            .set('Cookie', [jwtToken]) // Enviamos la cookie
            .send({
                name: 'Test Product E2E',
                price: 50.5,
                stock: 10,
                description: 'Created via E2E test'
            })
            .expect(201)
            .expect((res) => {
                // Validamos que la respuesta tenga los datos correctos
                expect(res.body.name).toBe('Test Product E2E');
                expect(res.body.id).toBeDefined();
            });
    });
});