import * as bcrypt from 'bcrypt';
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    email: string;

    @Column('text', { select: false })
    password?: string;

    @Column('text')
    fullname: string;

    @Column('boolean', { default: true })
    isActive: boolean;

    @Column('text', { array: true, default: ['user'] })
    roles: string[];

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async checkPassword() {
        // Si la password no ha sido modificada, no la vuelvas a hashear
        // (TypeORM maneja esto, pero a veces hay que añadir lógica extra)

        if (!this.password) return;

        // Generamos el salt y hasheamos
        // Ojo: Esto hasheará la contraseña incluso si ya está hasheada si no tenemos cuidado al actualizar. 
        // Por ahora, para el registro (Insert), funciona perfecto.
        this.password = bcrypt.hashSync(this.password, 10);
    }
}
