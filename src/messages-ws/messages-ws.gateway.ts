import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesWsService } from './messages-ws.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: true }) // Habilitamos CORS para que cualquier cliente se conecte
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: Server; // Referencia al servidor de sockets (para emitir a todos)

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService
  ) { }

  async handleConnection(client: Socket) {
    // 1. Extraer el token
    // Puede venir en headers 'authentication' (Postman) o en la cookie (Navegador)
    let token = client.handshake.headers.authentication as string;

    // Si no viene en header directo, intentamos leer la cookie
    if (!token && client.handshake.headers.cookie) {
      // Parseo manual rápido de la cookie (o usa librería 'cookie')
      const cookies = client.handshake.headers.cookie.split('; ').reduce((prev, current) => {
        const [name, ...value] = current.split('=');
        prev[name] = value.join('=');
        return prev;
      }, {});
      token = cookies['Authentication'];
    }

    try {
      // 2. Verificar token
      if (!token) throw new Error('Token not found');

      const payload = this.jwtService.verify(token); // Esto lanza error si es inválido

      // 3. Registrar cliente + usuario
      await this.messagesWsService.registerClient(client, payload.id);

    } catch (error) {
      // 4. Si falla, desconectar
      client.disconnect();
      return;
    }

    console.log(`Cliente conectado: ${client.id}`);

    // Notificar a todos
    this.server.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
    this.messagesWsService.removeClient(client.id);

    this.server.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }
}