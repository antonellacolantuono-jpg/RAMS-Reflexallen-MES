export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
}

export interface AuditFields {
  createdBy: string
  updatedBy: string
}

export interface PlantScoped {
  plantId: string
}

export type SoftDeletable = Pick<BaseEntity, 'deletedAt'>
