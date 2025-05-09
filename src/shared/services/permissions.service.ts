import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EntityTarget } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '@modules/user/entities/user.entity';

@Injectable()
export class EntityPermissionsService {
    constructor(
        @InjectDataSource()
        private dataSource: DataSource,
    ) { }

    /**
     * Check if a user has permission to access an entity
     */
    canAccessEntity(entity: any, user: User): boolean {
        // Check if entity has a user property with an id
        if (entity?.user?.id) return entity.user.id === user.id;

        return false;
    }

    /**
      * Find a user by ID and ensure they exist
      */
    async getUserById(userId: string): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user) throw new NotFoundException('User not found');

        return user;
    }

    /**
     * Find a user by email and ensure they exist
     */
    async getUserByEmail(email: string): Promise<User> {
        const userRepository = this.dataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });

        if (!user) throw new NotFoundException('User not found');

        return user;
    }

    // to get a more reliable entity name
    private getEntityName<T>(entityClass: EntityTarget<T>): string {
        try {
            const metadata = this.dataSource.getMetadata(entityClass);
            return metadata.name;
        } catch {
            const classString = entityClass.toString();
            const match = classString.match(/function (\w+)/);
            return match ? match[1] : 'Entity';
        }
    }

    async getEntityWithPermissionCheck<T>(
        entityClass: EntityTarget<T>,
        entityId: string,
        user: User,
        relations: string[] = ['user'],
    ): Promise<T> {
        const repository = this.dataSource.getRepository(entityClass);

        const entity = await repository.findOne({
            where: { id: entityId } as any,
            relations: relations,
        });

        if (!entity) throw new NotFoundException(`${this.getEntityName(entityClass)} not found`);

        if (!this.canAccessEntity(entity, user)) {
            const entityName = entityClass.toString().split(' ')[1];
            throw new ForbiddenException(`You do not have permission to access this ${entityName.toLowerCase()}`);
        }

        return entity;
    }
}