import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { Injectable } from '@nestjs/common';

/**
 * Converts camelCase property names to snake_case column names.
 */
@Injectable()
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  private snakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName || this.snakeCase(targetName);
  }

  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    const base = customName || this.snakeCase(propertyName);
    return embeddedPrefixes.length ? `${embeddedPrefixes.join('_')}_${base}` : base;
  }

  relationName(propertyName: string): string {
    return this.snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return this.snakeCase(relationName + '_' + referencedColumnName);
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
  ): string {
    return this.snakeCase(firstTableName + '_' + firstPropertyName + '_' + secondTableName);
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return this.snakeCase(tableName + '_' + (columnName || propertyName));
  }

  classTableInheritanceParentColumnName(parentTableName: string, parentTableIdPropertyName: string): string {
    return this.snakeCase(parentTableName + '_' + parentTableIdPropertyName);
  }

  eagerJoinRelationAlias(alias: string, propertyPath: string): string {
    return alias + '__' + propertyPath;
  }
}
