import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MessagesWsService {
    private connectedClients: Record<string, { socket: Socket, user: User }> = {};

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    // Ahora registramos el socket Y el usuario
    async registerClient(client: Socket, userId: string) {
        const user = await this.userRepository.findOneBy({ id: userId });

        if (!user) throw new Error('User not found');
        if (!user.isActive) throw new Error('User not active');

        // Mapeamos ID del socket -> Usuario completo
        this.connectedClients[client.id] = {
            socket: client,
            user: user
        };
    }

    removeClient(clientId: string) {
        delete this.connectedClients[clientId];
    }

    // Retornamos nombres de usuarios conectados (para probar)
    getConnectedClients(): string[] {
        // console.log(this.connectedClients); // Debug
        return Object.keys(this.connectedClients);
    }

    // Método útil para obtener el usuario de un socketId
    getUserBySocketId(socketId: string) {
        return this.connectedClients[socketId]?.user;
    }
}